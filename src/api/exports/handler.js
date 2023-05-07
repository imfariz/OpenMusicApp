const autoBind = require('auto-bind');

class ExportsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postExportPlaylistsHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    this._validator.validateExportPlaylistsPayload(request.payload);

    const message = {
      userId: credentialId,
      playlistId: id,
      targetEmail: request.payload.targetEmail,
    };

    await this._service.sendMessage('export:playlists', JSON.stringify(message), id, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
