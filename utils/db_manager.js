"use strict";

// Connection to the database
const sqlite3 = require("sqlite3").verbose();

var DB_PATH = "./db/wiatalk.db";

class Manager {
	constructor() {
		// open the database
		this.db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
			if (err) {
				console.error(err.message);
				console.error(err.stack);
			}
			console.log("Connected to the wiatalk database.");
		});
	}

	insertContact(telephone, username, email) {
		let query = `INSERT INTO contacts(telephone, username, email)
                        VALUES ('${telephone}','${username}','${email}');`;
		return new Promise((resolve, reject) => {
			this.db.run(query, [], (err) => {
				if (err) {
					reject(err);
				} else {
					resolve(true);
				}
			});
		});
	}
	insertMessage(emit, recv, type, date, content) {
		let query = `INSERT INTO messages(emetteur, recepteur, type, date, content)
                        VALUES ("${emit}","${recv}","${type}", "${date}", "${content}");`;
		return new Promise((resolve, reject) => {
			this.db.run(query, [], (err) => {
				if (err) {
					reject(err);
				} else {
					resolve(true);
				}
			});
		});
	}
	allContacts() {
		return new Promise((resolve, reject) => {
			this.db.serialize(() => {
				this.db.all(`SELECT * FROM contacts`, (err, rows) => {
					if (err) {
						reject(err);
					}
					resolve(rows);
				});
			});
		});
	}
	eachContacts(callback) {
		this.db.serialize(() => {
			this.db.each(`SELECT * FROM contacts`, (err, row) => {
				if (err) {
					console.error(err.message);
					console.error(err.stack);
				}
				callback(row);
			});
		});
	}
	discussion(emit, recv) {
		return new Promise((resolve, reject) => {
			this.db.serialize(() => {
				let query = `SELECT * FROM messages
                                WHERE
                                    (emetteur='${emit}' AND
                                    recepteur='${recv}') OR
                                    (emetteur='${recv}' AND
                                    recepteur='${emit}')
                                ORDER BY
                                    date ASC;`;
				this.db.all(query, (err, rows) => {
					if (err) {
						reject(err);
					}
					resolve(rows);
				});
			});
		});
	}
	lastMessage(emit, recv) {
		return new Promise((resolve, reject) => {
			let query = `SELECT * FROM messages
                            WHERE
                                emetteur='${emit}' AND
                                recepteur='${recv}' AND
                                type='TEXT'
                            ORDER BY
                                date DESC;
                        `;
			this.db.get(query, (err, row) => {
				if (err) {
					reject(err);
				} else {
					resolve(row);
				}
			});
		});
	}
	allMessages(emit, recv, type, date, limit) {
		return new Promise((resolve, reject) => {
			this.db.serialize(() => {
				let query = "SELECT * FROM messages";
				if (emit || recv || date || type) {
					let i = 0;
					query += " WHERE ";
					query += emit ? `emetteur='${emit}'` + " AND " : "";
					query += recv ? `recepteur='${recv}'` + " AND " : "";
					query += date ? `date>='${date}'` + " AND " : "";
					query += type ? `type='${type}'` + "" : "";
					query += ";";
					if (query.indexOf("AND ;") != -1) {
						query = query.replace("AND ;", ";");
					}
				}
				query += "";
				this.db.all(query, (err, rows) => {
					if (err) {
						reject(err);
					}
					resolve(rows);
				});
			});
		});
	}
	allTextMessages(emit, recv, date) {
		return this.allMessages(emit, recv, "TEXT", date);
	}

	allAudioCalls(emit, recv, date) {
		return this.allMessages(emit, recv, "AUDIO", date);
	}

	allVideoCalls(emit, recv, date) {
		return this.allMessages(emit, recv, "VIDEO", date);
	}
	testInsertion() {
		this.insertContact("+237697310443", "stephane", "aroldstephane@gmail.com")
			.then((res) =>
				console.log(res ? "Insertion réussie" : "Echec de l'insertion")
			)
			.catch((err) => {
				console.error(err);
			});
		this.insertMessage(
			"+237697310443",
			"+237691671707",
			"TEXT",
			new Date().toISOString().replace(/T/, " ").replace(/\..+/, ""),
			"slt bro"
		)
			.then((res) =>
				console.log(res ? "Insertion réussie" : "Echec de l'insertion")
			)
			.catch((err) => {
				console.error(err);
			});
	}
	testLecture() {
		this.allContacts()
			.then((contacts) => {
				console.log("liste de tous les contacts :");
				console.log(contacts);
			})
			.catch((err) => {
				console.error(err.message);
				console.error(err.stack);
			});
		this.eachContacts((contact) => console.log(contact));
		this.allMessages()
			.then((messages) => {
				console.log("liste de tous les messages :");
				console.log(messages);
			})
			.catch((err) => {
				console.error(err.message);
				console.error(err.stack);
			});
		this.lastMessage("+237691671707", "+237698947127")
			.then((contact) => {
				console.log("dernier message envoyé");
				console.log(contact);
			})
			.catch((err) => {
				console.error(err);
			});
	}
	tests() {
		this.testInsertion();
		this.testLecture();
	}
	close() {
		this.db.close((err) => {
			if (err) {
				console.error(err.message);
				console.error(err.stack);
			}
			console.log("Close the database connection.");
		});
	}
}

module.exports = { Database: Manager };
