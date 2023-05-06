const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const { mapDBToModelPlaylist } = require('../../utils');

class PlaylistsService {
  constructor(songService, collaborationService) {
    this._pool = new Pool();
    this._songService = songService;
    this._collaborationService = collaborationService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: 'SELECT P.id, P.name, U.username as owner FROM playlists as P LEFT JOIN collaborations as C ON C.playlist_id = P.id JOIN users as U ON U.id = P.owner WHERE P.owner = $1 OR C.user_id = $1',
      values: [owner],
    };
    const result = await this._pool.query(query);
    return result.rows.map(mapDBToModelPlaylist);
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlists gagal dihapus. Id tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlist_id, song_id) {
    const verifySong = await this._songService.getSongById(song_id);
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlist_id, verifySong.id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getSongsOnPlaylist(id) {
    const query = {
      text: 'SELECT P.id, P.name, U.username, PS.song_id, S.title, S.performer FROM playlist_songs as PS JOIN playlists as P ON P.id = PS.playlist_id JOIN songs as S ON PS.song_id = S.id JOIN users AS U ON P.owner = U.id WHERE PS.playlist_id=$1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result;
  }

  async deleteSongFromPlaylist(playlist_id, song_id) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      values: [playlist_id, song_id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal dihapus');
    }
  }

  async addActivity(playlist_id, song_id, user_id, action) {
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5)',
      values: [id, playlist_id, song_id, user_id, action],
    };

    await this._pool.query(query);
  }

  async getActivities(id) {
    const query = {
      text: 'SELECT PSA.playlist_id, U.username, S.title, PSA.time, PSA.action FROM playlist_song_activities as PSA JOIN songs as S ON PSA.song_id = S.id JOIN users as U ON U.id = PSA.user_id WHERE PSA.playlist_id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Aktifitas tidak ditemukan');
    }

    return result;
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
