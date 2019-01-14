let idPlayer = 0;

let players = [
	{
		"firstname": "Gwennael",
		"lastname": "Buchet",
		"score": 17
	},
	{
		"firstname": "Logan",
		"lastname": "Hauspie",
		"score": 17
	},
	{
		"firstname": "Jenna",
		"lastname": "Haze",
		"score": 0
	},
	{
		"firstname": "Marcel",
		"lastname": "Beliveau",
		"score": 0
	},
	{
		"firstname": "Régine",
		"lastname": "Zylberberg",
		"score": 0
	},
	{
		"firstname": "Tori",
		"lastname": "Black",
		"score": 0
	}
];

function updateScoresList() {

	let tbody = document.getElementById("table-list");

	tbody.innerHTML = "";

	for (let player of players) {
		tbody.innerHTML += "<tr>\n"
		                   + "\t\t<td class=\"text-left\">" + player.firstname + " " + player.lastname + "</td>\n"
		                   + "\t\t<td class=\"text-left\">" + player.score + "</td>\n"
		                   + "</tr>";
	}
}

function loadParams() {
	let url = new URL(document.URL);
	idPlayer = url.searchParams.get("id");

	updatePlayerPhoto(idPlayer);
}

function updatePlayerPhoto(idPlayer) {
	let filename = players[idPlayer].firstname + "_" + players[idPlayer].lastname + ".jpg";
	let img = document.getElementById("playerPhoto");
	img.src = "../assets/customers/" + filename;
}

window.addEventListener('load', updateScoresList, false);
window.addEventListener('load', loadParams, false);