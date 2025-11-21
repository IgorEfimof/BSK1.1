document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculateBtn');
    const checkTotalBtn = document.getElementById('checkTotalBtn');

    // Хранилище для результатов симуляции, чтобы не запускать ее повторно
    let simulationResults = [];

    calculateBtn.addEventListener('click', runSimulation);
    checkTotalBtn.addEventListener('click', displaySpecificProbability);

    function runSimulation() {
        // 1. Сбор данных из полей ввода
        const score1 = parseInt(document.getElementById('score1').value);
        const score2 = parseInt(document.getElementById('score2').value);
        const minutes = parseInt(document.getElementById('minutes').value);
        const seconds = parseInt(document.getElementById('seconds').value);
        const gameDuration = parseInt(document.getElementById('gameDuration').value);

        // Показываем лоадер и скрываем старые результаты
        document.getElementById('loader').classList.remove('hidden');
        document.getElementById('results').classList.add('hidden');
        
        // Запускаем расчет в асинхронной функции, чтобы интерфейс не зависал
        setTimeout(() => {
            // 2. Базовые расчеты
            const currentTotal = score1 + score2;
            const timeRemainingInSeconds = (minutes * 60) + seconds;
            const totalGameTimeInSeconds = gameDuration * 60;
            const timeElapsedInSeconds = totalGameTimeInSeconds - timeRemainingInSeconds;

            if (currentTotal === 0 || timeElapsedInSeconds <= 0) {
                alert("Невозможно рассчитать: текущий счет или прошедшее время равны нулю.");
                document.getElementById('loader').classList.add('hidden');
                return;
            }

            // Ключевой параметр: среднее количество секунд на набор одного очка
            const avgSecondsPerPoint = timeElapsedInSeconds / currentTotal;

            // 3. Настройки симуляции
            const NUM_SIMULATIONS = 20000; // Больше симуляций - точнее результат
            const finalTotals = [];

            // Вероятности набора 1, 2 или 3 очков за одну атаку
            // Можно менять для большей точности, если знаете стиль игры команд
            const pointProbabilities = [
                { points: 1, weight: 0.15 }, // Штрафные
                { points: 2, weight: 0.65 }, // Двухочковые
                { points: 3, weight: 0.20 }  // Трехочковые
            ];

            // 4. Запуск симуляций Монте-Карло
            for (let i = 0; i < NUM_SIMULATIONS; i++) {
                let projectedPoints = 0;
                let timeCursor = timeRemainingInSeconds;

                while (timeCursor > 0) {
                    // Используем экспоненциальное распределение для более реалистичного времени между событиями
                    const timeToNextPointAttempt = -Math.log(Math.random()) * avgSecondsPerPoint;

                    if (timeCursor >= timeToNextPointAttempt) {
                        timeCursor -= timeToNextPointAttempt;
                        projectedPoints += getScoredPoints(pointProbabilities);
                    } else {
                        break; // Времени не осталось
                    }
                }
                finalTotals.push(currentTotal + projectedPoints);
            }

            simulationResults = finalTotals; // Сохраняем результаты
            displayResults();
            document.getElementById('loader').classList.add('hidden');
        }, 50); // Небольшая задержка для отрисовки лоадера
    }

    // Вспомогательная функция для определения, сколько очков забито
    function getScoredPoints(probabilities) {
        const rand = Math.random();
        let cumulativeWeight = 0;
        for (const prob of probabilities) {
            cumulativeWeight += prob.weight;
            if (rand < cumulativeWeight) {
                return prob.points;
            }
        }
        return 2; // По умолчанию, если что-то пошло не так
    }

    // Функция для отображения основных результатов
    function displayResults() {
        if (simulationResults.length === 0) return;

        const sum = simulationResults.reduce((a, b) => a + b, 0);
        const avg = sum / simulationResults.length;
        
        simulationResults.sort((a, b) => a - b);
        const lowerBound = simulationResults[Math.floor(simulationResults.length * 0.25)];
        const upperBound = simulationResults[Math.floor(simulationResults.length * 0.75)];

        document.getElementById('avgTotal').textContent = avg.toFixed(1);
        document.getElementById('likelyRange').textContent = `${lowerBound} - ${upperBound}`;
        document.getElementById('results').classList.remove('hidden');
        
        displaySpecificProbability(); // Сразу обновляем и вероятность для конкретного тотала
    }

    // Функция для расчета и отображения вероятности по заданному числу
    function displaySpecificProbability() {
        if (simulationResults.length === 0) return;

        const checkValue = parseFloat(document.getElementById('checkTotalInput').value);
        if (isNaN(checkValue)) return;
        
        const countOver = simulationResults.filter(total => total > checkValue).length;
        const countUnder = simulationResults.length - countOver;

        const probOver = (countOver / simulationResults.length) * 100;
        const probUnder = (countUnder / simulationResults.length) * 100;

        document.getElementById('specificProbability').innerHTML = 
            `Вероятность ТБ ${checkValue}: <strong>${probOver.toFixed(2)}%</strong><br>
             Вероятность ТМ ${checkValue}: <strong>${probUnder.toFixed(2)}%</strong>`;
    }
});
