const scripts = {
	"1": [
		[0, 1, 0, 2],
		[3, 1, 0, 0],
		[2, 3, 0, 1],
		[3, 2, 0, 3],
		[3, 0, 0, 4],
		[1, 4, null, null],
		[2, 0, null, null],
		[1, 1, null, null],
	],
	"3": [
		[1, 2, 4, 2],
		[2, 3, 2, 1],
		[1, 0, 2, 0],
		[4, 3, null, null],
		[4, 1, 4, 0],
		[4, 1, null, null]
	],
	"11": [
		[3, 1, 1, 0],
		[0, 1, 0, 2],
		[2, 4, 0, 0],
		[3, 2, 0, 1],
		[3, 0, 0, 3],
		[1, 4, 0, 4],
		[3, 4, null, null],
		[2, 0, null, null],
		[1, 1, null, null]
	],
	"17": [
		[3, 1, 1, 4],
		[0, 3, 0, 2],
		[4, 2, 0, 4],
		[2, 1, 0, 3],
		[0, 1, 3, 4],
		[4, 3, 2, 4],
		[4, 1, null, null],
		[4, 4, null, null],
		[1, 3, null, null]
	],
	"23": [
		[4, 3, 4, 2],
		[3, 1, 4, 4],
		[2, 1, 2, 4],
		[1, 2, 4, 1],
		[3, 0, 4, 0],
		[1, 4, null, null],
		[3, 3, 4, 3],
		[3, 3, null, null]
	],
	"61": [
		[3, 1, 1, 4],
		[0, 3, 0, 4],
		[3, 2, 0, 2],
		[2, 1, 0, 1],
		[3, 4, 0, 0],
		[1, 0, null, null],
		[1, 3, 0, 3],
		[1, 3, null, null]
	]
};

/** @param {NS} ns */
export async function main(ns) {
	const spin_count = await scum(ns);
	ns.tprint(spin_count);
	ns.tprint(ns.go.getBoardState());

	await ns.go.makeMove(1, 1);
	const { m, n } = await ns.go.makeMove(3, 3);
	const { x, y } = await ns.go.makeMove(1, 3);

	let hash = x + 5 * y;
	if (hash === 11 && m + 5 * n === 22) {
		hash += 50;
	}
	ns.tprint(hash);
	if (!(hash in scripts)) {
		ns.tprint(`unexpected hash(${hash}) [${x},${y}]`);
		return;
	}

	await playout(ns, scripts[hash]);
}

const playout = async (ns, moves) => {
	for (const [a, b, c, d] of moves) {
		const { x, y } = await ns.go.makeMove(a, b);
		if (x !== c || y !== d) {
			ns.tprint(`unexpected countermove (${x},${y}) !(${c},${d})`);
			return;
		}
	}
	ns.go.passTurn();
}

const scum = async (ns) => {
	// I have seen 1_802_240 retries
	// sleep prevents ui lockup
	// don't look at the IPvGO board while this is running, lockup 
	let i = 0;
	while (ns.go.resetBoardState("Illuminati", 5).join("") !== "............O............") {
		i++;
		if (i % 16_384 === 0) {
			await ns.sleep(4);
		}
	}
	return i;
}
