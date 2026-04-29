// Seleciona os elementos do HTML
const canvas = document.getElementById("snakeGame");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

const box = 20; // Tamanho de cada quadrado da grelha
let score = 0;
let d;
let changingDirection = false; // Variável para evitar o bug de pressionar duas teclas muito rápido

// A cobra começa no meio do ecrã
let snake = [{ x: 9 * box, y: 10 * box }];

// Função para gerar comida numa posição aleatória em todo o tabuleiro (0 a 19)
function generateFood() {
    return {
        x: Math.floor(Math.random() * 20) * box,
        y: Math.floor(Math.random() * 20) * box
    };
}

// Comida (maçã) inicial
let food = generateFood();

// Deteta as teclas pressionadas para mudar a direção
document.addEventListener("keydown", direction);

function direction(event) {
    // Se já estiver a mudar de direção neste "frame", ignora outras teclas
    if (changingDirection) return;

    const key = event.key;
    
    // Atualizado para usar event.key (suporta setas e WASD)
    if((key === "ArrowLeft" || key === "a" || key === "A") && d !== "RIGHT") {
        d = "LEFT";
        changingDirection = true;
    } else if((key === "ArrowUp" || key === "w" || key === "W") && d !== "DOWN") {
        d = "UP";
        changingDirection = true;
    } else if((key === "ArrowRight" || key === "d" || key === "D") && d !== "LEFT") {
        d = "RIGHT";
        changingDirection = true;
    } else if((key === "ArrowDown" || key === "s" || key === "S") && d !== "UP") {
        d = "DOWN";
        changingDirection = true;
    }
}

// Verifica se a cobra choca contra o próprio corpo
function collision(head, array) {
    for(let i = 0; i < array.length; i++) {
        if(head.x === array[i].x && head.y === array[i].y) return true;
    }
    return false;
}

// Função principal que desenha o jogo
function draw() {
    // Permite que o jogador mude de direção novamente no novo frame
    changingDirection = false;

    // Limpa o fundo com a cor do tabuleiro
    ctx.fillStyle = "#0f3460";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha a cobra
    for(let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i === 0) ? "#4ecca3" : "#45b293"; // A cabeça tem uma cor diferente
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
    if(d === "LEFT") snakeX -= box;
    if(d === "UP") snakeY -= box;
    if(d === "RIGHT") snakeX += box;
    if(d === "DOWN") snakeY += box;

    // Se a cobra comer a maçã
    if(snakeX === food.x && snakeY === food.y) {
        score++;
        scoreElement.innerHTML = score;
        // Gera nova comida
        food = generateFood();
    } else {
        // Remove a cauda para simular movimento
        snake.pop();
    }

    let newHead = { x: snakeX, y: snakeY };

    // Fim do Jogo (se bater nas paredes ou nela própria)
    if(snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake)) {
        clearInterval(game);
        alert("Fim do Jogo! Pontuação: " + score);
        location.reload();
    }

    // Adiciona a nova cabeça ao início do corpo
    snake.unshift(newHead);
}

// Executa a função draw a cada 100ms
let game = setInterval(draw, 100);
