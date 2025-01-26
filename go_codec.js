/** @param {NS} ns */
export async function main(ns) {
  const [code] = ns.args;
  if (code) {
    ns.tprintf(line_block_to_square_grid(decode_to_boards(code)));
    return
  }

  while (true) {
    await wait_for_game_start(ns);
    await wait_for_game_end(ns);
    ns.write("go_games.txt", `${ns_to_code(ns)}\n`, "a");
    ns.toast("Go game saved");
    await ns.sleep(1_000);
  }
}

async function wait_for_game_start(ns) {
  while ("None" === ns.go.getCurrentPlayer()) {
    await ns.sleep(1_000);
  }
  // after selecting a new subnet player is black
  // but turn.type stays gameOver until black moves
  while (true) {
    const turn = await ns.go.opponentNextTurn();
    await ns.sleep(1_000);
    if (turn.type !== "gameOver") {
      return
    }
  }
}

async function wait_for_game_end(ns) {
  while (true) {
    const turn = await ns.go.opponentNextTurn();
    await ns.sleep(1_000);
    if (turn.type === "gameOver") {
      return
    }
  }
}

function line_block_to_square_grid(boards, width, pprint = true) {
  const slices = boards
    .split("\n")
    .map(line_board_to_square_slices);

  if (!width) {
    width = Math.min(12, Math.ceil(slices.length / 5));
  }

  const grid = [];
  for (let i = 0; i < slices.length; i += width) {
    const row = [];
    const wide = Math.min(width, slices.length - i)
    for (let j = 0; j < 5; j++) {
      const line = [];
      for (let k = 0; k < wide; k++) {
        line.push(slices[i + k][j]);
      }
      row.push(line.join(" "));
    }
    grid.push(row.join("\n"));
  }

  const out = grid.join("\n\n");
  if (pprint) {
    return pretty(out);
  }
  return out;
}

function ns_to_code(ns) {
  const full_history = [ns.go.getBoardState(), ...ns.go.getMoveHistory()]
    .reverse()
    .map(state_to_flat_string);
  return encode_boards(full_history);
}

function line_boards_to_square_boards(boards) {
  return boards
    .split("\n")
    .map(line_board_to_square_board)
    .join("\n\n");
}

function line_board_to_square_board(board) {
  //  return `${board.slice(0, 5)}
  // ${board.slice(5, 10)}
  // ${board.slice(10, 15)}
  // ${board.slice(15, 20)}
  // ${board.slice(20, 25)}`;
  return [0, 5, 10, 15, 20]
    .map(i => board.slice(i, i + 5))
    .join("\n");
}

function line_board_to_square_slices(board) {
  return [0, 5, 10, 15, 20]
    .map(i => board.slice(i, i + 5));
}

function state_to_flat_string(state) {
  // rotate 270 so the ascii looks like what is on the screen
  // rot270 = flipDiag + flipVert
  return state
    .map(s => s.split("")) // str[] => char[][]
    // i times, make a new row from the ith element of each row
    .map((_, i, a) => a.map(r => r[i])) // flipDiag
    .reverse() // flipVert
    .map(s => s.join(""))
    .join("");
}

function pretty(boards) {
  const yellow_X = "\x1b[33mX\x1b[0m";
  const yellow_O = "\x1b[33mO\x1b[0m";
  const red_comma = "\x1b[31m,\x1b[0m";
  return boards
    .replaceAll("#", " ")
    .replaceAll(",", red_comma)
    .replaceAll("X", yellow_X)
    .replaceAll("O", yellow_O);
}

function decode_to_boards(code) {
  const boards = [];
  const [gaps, ...move_groups] = code.split(">");
  const board = gaps_to_board(gaps);
  boards.push(board.join(""));

  const moves = move_groups_to_moves(move_groups);
  for (const [m, ...captures] of moves) {
    clean_board(board);
    add_move(board, m);
    add_captures(board, captures);
    boards.push(board.join(""));
  }

  return boards.join("\n");
}

function add_move(board, m) {
  const play = char_to_i(m);
  if (play >= 25) {
    board[play - 25] = "O";
  } else {
    board[play] = "X";
  }
}

function add_captures(board, captures) {
  for (const c of captures) {
    board[char_to_i(c)] = ",";
  }
}

function clean_board(board) {
  for (const [i, stone] of board.entries()) {
    switch (stone) {
      case "O":
        board[i] = "o";
        break;
      case "X":
        board[i] = "x";
        break;
      case ",":
        board[i] = ".";
    }
  }
}

function move_groups_to_moves(move_groups) {
  const moves = [];
  for (const mg of move_groups) {
    const [a, b] = mg.split("<");
    moves.push(...a);
    if (b) {
      moves.push(moves.pop() + b);
    }
  }
  return moves;
}

function encode_boards(boards) {
  const gaps = board_to_gaps(boards[0]);
  const moves = [`${gaps}>`];
  let prev_board = gaps_to_board(gaps).join("");

  for (const board of boards) {
    moves.push(dif_boards(prev_board, board));
    prev_board = board;
  }

  return moves.join("");
}

function dif_boards(a, b) {
  const play = [];
  const capture = [];

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      switch (b[i]) {
        case 'X':
          play.push(i_to_char(i));
          break;
        case 'O':
          play.push(i_to_char(i + 25));
          break;
        case '.':
          capture.push(i_to_char(i));
      }
    }
  }

  if (capture.length) {
    play.push(`<${capture.join("")}>`);
  }

  return play.join("");
}

function i_to_char(i) {
  // return String.fromCharCode(i + 97); // 'a'.charCodeAt(0)
  return "abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXY"[i];
}

function char_to_i(c) {
  // return c.charCodeAt(0) - 97; // 'a'.charCodeAt(0);
  return "abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXY".indexOf(c);
}

function gaps_to_board(gaps, length = 25) {
  const board = Array(length).fill(".");
  [...gaps]
    .map(char_to_i)
    .forEach(i => board[i] = "#");
  return board;
}

function board_to_gaps(board) {
  return [...board.matchAll(/#/g)]
    .map(({ index }) => i_to_char(index))
    .join("");
}
