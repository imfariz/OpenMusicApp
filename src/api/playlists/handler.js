const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._service.addPlaylist({ name, owner: credentialId });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._service.getPlaylists(credentialId);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(id, credentialId);
    await this._service.deletePlaylistById(id);
    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postSongToPlaylistHandler(request, h) {
    this._validator.validateSongPlaylistPayload(request.payload);
    const { songId } = request.payload;
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    const activity = 'add';

    await this._service.verifyPlaylistAccess(id, credentialId);
    const song = await this._service.addSongToPlaylist(id, songId);
    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan',
      data: {
        song,
      },
    });
    await this._service.addActivity(id, songId, credentialId, activity);
    response.code(201);
    return response;
  }

  async getSongsOnPlaylistHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(id, credentialId);
    const result = await this._service.getSongsOnPlaylist(id);
    const datas = result.rows;
    let playlist;

    const playlistInformation = {
      id: datas[0].id,
      name: datas[0].name,
      username: datas[0].username,
    };

    if (datas[0] === null) {
      playlist = {
        ...playlistInformation,
        songs: [],
      };
    } else {
      const songs = datas.map((data) => ({
        id: data.song_id,
        title: data.title,
        performer: data.performer,
      }));
      playlist = {
        ...playlistInformation,
        songs,
      };
    }

    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deleteSongsOnPlaylistHandler(request) {
    this._validator.validateSongPlaylistPayload(request.payload);
    const { songId } = request.payload;
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    const activity = 'delete';

    await this._service.verifyPlaylistAccess(id, credentialId);
    await this._service.deleteSongFromPlaylist(id, songId);
    await this._service.addActivity(id, songId, credentialId, activity);
    return {
      status: 'success',
      message: 'Lagu dalam Playlist berhasil dihapus',
    };
  }

  async getPlaylistActivitiesHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(id, credentialId);
    const result = await this._service.getActivities(id);
    const datas = result.rows;
    const playlistId = datas[0].playlist_id;
    const activities = datas.map((data) => ({
      username: data.username,
      title: data.title,
      action: data.action,
      time: data.time,
    }));

    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }
}

module.exports = PlaylistsHandler;
