"use strict";

const { Database } = require("./utils/db_manager");
const WebSocket = require("ws");

const PORT = 9091;

const MESSAGE_TYPE = {
	EXIT: "EXIT",
	LIST_CONTACTS: "LIST_CONTACTS",
	FIRST_CONTACT: "FIRST_CONTACT",
	LIST_MESSAGES: "LIST_MESSAGES",
	DISCUSSION: "DISCUSSION",
	INSERT_CONTACT: "INSERT_CONTACT",
	INSERT_MESSAGE: "INSERT_MESSAGE",
};

class App {
	constructor() {
		this.db = new Database();
		this.wss = new WebSocket.Server({ port: PORT });
		this.db.tests();
	}
	run() {
		const APP = this;
		this.wss.on("connection", function connection(ws) {
			console.log("user connected");
			ws.on("message", function incoming(request) {
				const { type, params } = JSON.parse(request);
				switch (type) {
					case MESSAGE_TYPE.EXIT:
						APP.exit();
						return;
					case MESSAGE_TYPE.LIST_CONTACTS:
						// list constacts
						APP.db.allContacts().then((contacts) => {
							const answer = {
								data: contacts,
							};
							ws.send(JSON.stringify(answer));
						});
						break;
					case MESSAGE_TYPE.DISCUSSION:
                        // récupération de la discussion
						APP.db
							.discussion(params.emit, params.recv)
							.then((messages) => {
								const answer = {
									data: messages,
								};
								ws.send(JSON.stringify(answer));
							});
						break;
					case MESSAGE_TYPE.FIRST_CONTACT:
						// first constact
						break;
					case MESSAGE_TYPE.LIST_MESSAGES:
						// list messages
						APP.db
							.allMessages(
								params.emit,
								params.recv,
								params.date || null,
								params.type || null
							)
							.then((messages) => {
								const answer = {
									data: messages,
								};
								ws.send(JSON.stringify(answer));
							});
						break;
					case MESSAGE_TYPE.INSERT_CONTACT:
						// insert contact
						break;
					case MESSAGE_TYPE.INSERT_MESSAGE:
						// insert message
						console.log("reception");
						APP.db
							.insertMessage(
								params.emit,
								params.recv,
								params.type,
								params.date,
								params.content
							)
							.then((status) => {
								console.log(
									status ? "insertion réussi" : "échec de l'insertion"
								);
								const answer = {
									data: status,
								};
								ws.send(JSON.stringify(answer));
							});
						break;
				}
				console.log("received: %s", request);
			});
			ws.send("something");
		});
		this.wss.on("close", function () {
			console.log("Close the WebSocket");
		});
	}
	exit() {
		this.db.close();
		this.wss.close();
	}
}

const app = new App();
app.run();
