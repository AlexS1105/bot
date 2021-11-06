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
		const jsonParser = express.json();

		router.post('/ticket', jsonParser, async (req, res) => {
			this.client.log.info('Create request received');
			try {
				const body = req.body;
				const guild_id = body.guild_id;
				const user_id = body.user_id;
				const registrar_id = body.registrar_id;
				const сategory_id = body.category_id;
				const topic = body.topic;
	
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
			} catch (error) {
				this.client.log.debug(error);
				res.send('Ticket not found')
			}; 
		});

		app.delete('/ticket', jsonParser, async (req, res) => {
			this.client.log.info('Delete request received');

			try {
				const body = req.body;
				const ticket_id = body.ticket_id;
	
				const ticket = await this.client.db.models.Ticket.findOne({ where: { id: ticket_id } });
	
				await this.client.tickets.close(ticket.id, ticket.creator, ticket.guild);
	
				this.client.log.info('Ticket closed!');
				res.send('Ticket deleted');
			} catch (error) {
				this.client.log.debug(error);
				res.send('Ticket not found');
			}; 
		});
	};
};
