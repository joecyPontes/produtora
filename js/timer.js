
const deadline = new Date("November 15, 2025 23:59:59").getTime();

const timer = setInterval(() => {
    const now = new Date().getTime();
    const distance = deadline - now;

    if (distance < 0) {
        clearInterval(timer);
        document.getElementById("timer").innerHTML = "O tempo acabou!";
        return;
    }

    const dias = Math.floor(distance / (1000 * 60 * 60 * 24));
    const horas = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((distance % (1000 * 60)) / 1000);

    // Função para formatar números com dois dígitos
    function formatNumber(num) {
        return num.toString().padStart(2, '0');
    }

    document.getElementById("horas").innerHTML = `${formatNumber(horas)}`;
    document.getElementById("minutos").innerHTML = `:${formatNumber(minutos)}`;
    document.getElementById("segundos").innerHTML = `:${formatNumber(segundos)}`;
}, 1000);