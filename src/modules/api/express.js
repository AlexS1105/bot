const express = require('express');

module.exports = class Express {
	/**
	 * Create a Express instance
	 * @param {import('../..').Bot} client
	 */
	constructor(client) {
		this.client = client;
		const app = express();
		const port = 3000;
		
		this.registerRoutes(app);
		
		app.listen(port, () => {
			client.log.info(`Express app listening at http://localhost:${port}`);
		});
	}

	registerRoutes(app) {
		const router = express.Router();
		app.use('/', router);

		router.post('/ticket', async (req, res) => {
			client.log.info('Request Received!');
			const guild_id = '790984766198644786';
			const user_id = '167230144371490816';
			const registrar_id = '167230144371490816';
			const сategory_id = '906451001094049822';
			const topic = 'Api Sent Topic';

			const registrar = await this.client.users.cache.get(registrar_id);

			const ticket = await this.client.tickets.create(guild_id, user_id, сategory_id, topic, true);
			await ticket.update({ claimed_by: registrar_id });

			const channel = await this.client.channels.cache.get(ticket.id);
			await channel.permissionOverwrites.edit(registrar_id, { VIEW_CHANNEL: true }, `Ticket claimed by ${registrar.tag}`);

			const category = await this.client.db.models.Category.findOne({ where: { id: сategory_id } });

			for (const role of category.roles) {
				await channel.permissionOverwrites.edit(role, { VIEW_CHANNEL: false }, `Ticket claimed by ${registrar.tag}`);
			}

			res.send(ticket);
		});

		app.delete('/ticket/:id', async (req, res) => {
			const ticket_id = req.params.id;

			const ticket = await this.client.db.models.Ticket.findOne({ where: { id: ticket_id } });

			await this.client.tickets.close(ticket.id, ticket.creator, ticket.guild);

			res.send(ticket_id);
		});
	}
};
