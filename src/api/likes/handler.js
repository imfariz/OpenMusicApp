const autoBind = require('auto-bind');

class LikesHandler {
  constructor(service) {
    this._service = service;

    autoBind(this);
  }

  async postLikeByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyUserLiked(id, credentialId);

    await this._service.addLikeToAlbum(id, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Anda menyukai album ini',
    });
    response.code(201);
    return response;
  }

  async deleteLikeByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.deleteLike(id, credentialId);
    return {
      status: 'success',
      message: 'Berhasil membatalkan like',
    };
  }

  async getLikesByIdHandler(request) {
    const { id } = request.params;

    const result = await this._service.getAlbumLikes(id);
    const likes = result.rowCount;
    return {
      status: 'success',
      data: {
        likes,
      },
    };
  }
}

module.exports = LikesHandler;
