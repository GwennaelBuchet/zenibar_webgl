let idPlayer = 0;

let players = null;

function loadPlayersData() {

	if (players === null) {
		players = JSON.parse(localStorage.getItem("players"));
	}

	//if "players" still null, then create a new one
	if (players === null) {
		players = [
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
		savePlayersData();
	}
}

function setPlayerScore(score) {
	if (players !== null) {
		players[idPlayer].score = Math.max(players[idPlayer].score, score);
	}
}

function savePlayersData() {

	if (players !== null) {
		localStorage.setItem("players", JSON.stringify(players));
	}
}

function updateScoresList() {

	loadParams();

	loadPlayersData();

	updatePlayerPhoto(idPlayer);

	let tbody = document.getElementById("table-list");

	if (tbody !== undefined && tbody !== null) {
		tbody.innerHTML = "";

		for (let player of players) {
			tbody.innerHTML += "<tr>\n"
			                   + "\t\t<td class=\"text-left\">" + player.firstname + " " + player.lastname + "</td>\n"
			                   + "\t\t<td class=\"text-left\">" + player.score + "</td>\n"
			                   + "</tr>";
		}
	}
}
function loadParams() {
	let url = new URL(document.URL);
	idPlayer = url.searchParams.get("id");

	if (idPlayer === undefined || idPlayer === null) {
		idPlayer = 0;
	}
}

function updatePlayerPhoto(idPlayer) {
	let filename = players[idPlayer].firstname + "_" + players[idPlayer].lastname + ".jpg";
	let img = document.getElementById("playerPhoto");
	img.src = "../assets/customers/" + filename;

	let btn = document.getElementById("playbtn");
	if (btn !== undefined && btn !== null) {
		btn.innerText = "Let's play, " + players[idPlayer].firstname;
	}
}

window.addEventListener('load', updateScoresList, false);