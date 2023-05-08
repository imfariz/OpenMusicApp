const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const { result, cached } = await this._service.getAlbumById(id);
    const datas = result.rows;
    let album;

    const dataResponse = {
      id: datas[0].album_id,
      name: datas[0].album_name,
      year: datas[0].album_year,
      coverUrl: datas[0].cover,
    };

    if (datas[0].id === null) {
      album = {
        ...dataResponse,
        songs: [],
      };
    } else {
      const songs = datas.map((data) => ({
        id: data.id,
        title: data.title,
        performer: data.performer,
      }));
      album = {
        ...dataResponse,
        songs,
      };
    }

    const response = h.response({
      status: 'success',
      data: {
        album,
      },
    });
    if (cached) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);
    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }
}

module.exports = AlbumsHandler;
