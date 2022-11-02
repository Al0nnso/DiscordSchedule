var firebase = require("firebase-admin");

var serviceAccount = require("./discord-msg-firebase-adminsdk-ex30z-c86fefc83d.json");

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
});


class Messages {
	static discord = {
		add: async (msg) => {
			const app = firebase.app();
			const db = app.firestore(app);

			return await db.collection("messages").add(msg);
		},

		get: async () => {
			const app = firebase.app();
			const db = firebase.firestore(app);
			//const uid = firebase.auth().currentUser.uid;

			const data = await db.collection("messages").get();

			return data.docs.map((doc) => {
				return { ...doc.data(), id: doc.id };
			});
		},

		remove: async (id) => {
			const app = firebase.app();
			const db = firebase.firestore(app);
			//const uid = firebase.auth().currentUser.uid;

			await db
				.collection("messages")
				.doc(id)
				.delete();
		},
	};
}

module.exports = Messages;