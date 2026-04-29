// Seleciona os elementos do HTML
const canvas = document.getElementById("snakeGame");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

const box = 20; // Tamanho de cada quadrado da grelha
let score = 0;
let d;

// A cobra começa no meio do ecrã
let snake = [{ x: 9 * box, y: 10 * box }];

// Comida (maçã) numa posição aleatória
let food = {
    x: Math.floor(Math.random() * 19 + 1) * box,
    y: Math.floor(Math.random() * 19 + 1) * box
};

// Deteta as teclas pressionadas para mudar a direção
document.addEventListener("keydown", direction);

function direction(event) {
    let key = event.keyCode;
    if(key == 37 && d != "RIGHT") d = "LEFT";
    else if(key == 38 && d != "DOWN") d = "UP";
    else if(key == 39 && d != "LEFT") d = "RIGHT";
    else if(key == 40 && d != "UP") d = "DOWN";
}

// Verifica se a cobra choca contra o próprio corpo
function collision(head, array) {
    for(let i = 0; i < array.length; i++) {
        if(head.x == array[i].x && head.y == array[i].y) return true;
    }
    return false;
}

// Função principal que desenha o jogo
function draw() {
    // Limpa o fundo com a cor do tabuleiro
    ctx.fillStyle = "#0f3460";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha a cobra
    for(let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i == 0) ? "#4ecca3" : "#45b293"; // A cabeça tem uma cor diferente
        ctx.strokeStyle = "#1a1a2e";
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }

    // Desenha a comida (uma maçã redondinha)
    ctx.fillStyle = "#e94560";
    ctx.beginPath();
    ctx.arc(food.x + box/2, food.y + box/2, box/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Posição atual da cabeça
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    // Move a cobra na direção escolhida
    if( d == "LEFT") snakeX -= box;
    if( d == "UP") snakeY -= box;
    if( d == "RIGHT") snakeX += box;
    if( d == "DOWN") snakeY += box;

    // Se a cobra comer a maçã
    if(snakeX == food.x && snakeY == food.y) {
        score++;
        scoreElement.innerHTML = score;
        // Gera nova comida
        food = {
            x: Math.floor(Math.random() * 19 + 1) * box,
            y: Math.floor(Math.random() * 19 + 1) * box
        };
    } else {
        // Remove a cauda para simular movimento
        snake.pop();
    }

    let newHead = { x: snakeX, y: snakeY };

    // Fim do Jogo (se bater nas paredes ou nela própria)
    if(snakeX < 0 || snakeX == canvas.width || snakeY < 0 || snakeY == canvas.height || collision(newHead, snake)) {
        clearInterval(game);
        alert("Fim do Jogo! Pontuação: " + score);
        location.reload();
    }

    // Adiciona a nova cabeça ao início do corpo
    snake.unshift(newHead);
}

// Executa a função draw a cada 100ms
let game = setInterval(draw, 100);