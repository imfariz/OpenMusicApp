const mapDBToModelSong = ({
  id,
  name,
  title,
  year,
  genre,
  performer,
  duration,
  album_id,
}) => ({
  id,
  name,
  title,
  year,
  genre,
  performer,
  duration,
  albumId: album_id,
});

const mapDBToModelPlaylist = ({
  id,
  name,
  owner,
}) => ({
  id,
  name,
  username: owner,
});

module.exports = { mapDBToModelSong, mapDBToModelPlaylist };
