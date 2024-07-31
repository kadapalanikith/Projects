document.addEventListener('DOMContentLoaded', () => {
    const calculator = document.querySelector('.calculator');
    const screen = document.querySelector('#calculator-screen');
    let firstOperand = '';
    let secondOperand = '';
    let operator = '';
    let shouldResetScreen = false;

    calculator.addEventListener('click', (event) => {
        if (!event.target.classList.contains('key')) return;

        const key = event.target;
        const action = key.dataset.action;
        const keyValue = key.textContent;
        const screenValue = screen.value;

        if (!action) {
            if (screenValue === '0' || shouldResetScreen) {
                screen.value = keyValue;
                shouldResetScreen = false;
            } else {
                screen.value = screenValue + keyValue;
            }
        }

        if (action === 'clear') {
            firstOperand = '';
            secondOperand = '';
            operator = '';
            screen.value = '';
        }

        if (action === 'delete') {
            screen.value = screen.value.slice(0, -1);
        }

        if (action === 'operator') {
            if (operator) {
                secondOperand = screenValue;
                screen.value = calculate(firstOperand, secondOperand, operator);
            }
            firstOperand = screen.value;
            operator = keyValue;
            shouldResetScreen = true;
        }

        if (action === 'calculate') {
            if (operator && firstOperand) {
                secondOperand = screenValue;
                screen.value = calculate(firstOperand, secondOperand, operator);
                firstOperand = '';
                operator = '';
                shouldResetScreen = true;
            }
        }
    });

    function calculate(first, second, operator) {
        const firstNum = parseFloat(first);
        const secondNum = parseFloat(second);
        if (operator === '+') return firstNum + secondNum;
        if (operator === '-') return firstNum - secondNum;
        if (operator === '*') return firstNum * secondNum;
        if (operator === '/') return firstNum / secondNum;
    }
});