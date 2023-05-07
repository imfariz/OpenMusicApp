const amqp = require('amqplib');

class ProducerService {
  constructor(playlistsService) {
    this._playlistsService = playlistsService;
  }

  async sendMessage(queue, message, id, owner) {
    await this._playlistsService.verifyPlaylistOwner(id, owner);
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, {
      durable: true,
    });

    await channel.sendToQueue(queue, Buffer.from(message));

    setTimeout(() => {
      connection.close();
    }, 1000);
  }
}

module.exports = ProducerService;
