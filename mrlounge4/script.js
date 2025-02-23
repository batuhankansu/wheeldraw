class WheelController {
    constructor(canvasId, items = []) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.items = items;
        this.weightedItems = [];
        this.rotation = 0;
        this.isSpinning = false;
        this.targetRotations = 0;
        this.isWeighted = false;

        this.canvas.width = 300;
        this.canvas.height = 300;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 10;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.rotation);

        const items = this.isWeighted ? this.weightedItems : this.items;
        const colors = ['#ff4500', '#ffd700', '#ff6347', '#ff69b4', '#ff1493'];

        if (this.isWeighted) {
            const totalWeight = this.weightedItems.reduce((sum, item) => sum + item.weight, 0);
            let currentAngle = -Math.PI / 2;

            items.forEach((item, index) => {
                const sliceAngle = (2 * Math.PI * item.weight) / totalWeight;
                const endAngle = currentAngle + sliceAngle;

                // Draw slice
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.arc(0, 0, this.radius, currentAngle, endAngle);
                this.ctx.closePath();
                
                this.ctx.fillStyle = colors[index % colors.length];
                this.ctx.fill();
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                // Draw text - only show name, not weight
                this.ctx.save();
                this.ctx.rotate(currentAngle + sliceAngle / 2);
                this.ctx.textAlign = 'right';
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillText(item.name, this.radius - 20, 5);
                this.ctx.restore();

                currentAngle = endAngle;
            });
        } else {
            // Original non-weighted drawing code
            const sliceAngle = (2 * Math.PI) / this.items.length;
            this.items.forEach((item, index) => {
                const startAngle = index * sliceAngle - Math.PI / 2;
                const endAngle = startAngle + sliceAngle;

                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.arc(0, 0, this.radius, startAngle, endAngle);
                this.ctx.closePath();
                
                this.ctx.fillStyle = colors[index % colors.length];
                this.ctx.fill();
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                this.ctx.save();
                this.ctx.rotate(startAngle + sliceAngle / 2);
                this.ctx.textAlign = 'right';
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillText(item.toString(), this.radius - 20, 5);
                this.ctx.restore();
            });
        }

        this.ctx.restore();
    }

    getItemsCount() {
        return this.isWeighted ? this.weightedItems.length : this.items.length;
    }

    getItem(index) {
        return this.isWeighted ? this.weightedItems[index].name : this.items[index];
    }

    getWeightedRandomIndex() {
        const totalWeight = this.weightedItems.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < this.weightedItems.length; i++) {
            random -= this.weightedItems[i].weight;
            if (random <= 0) {
                return i;
            }
        }
        return this.weightedItems.length - 1;
    }

    async spin() {
        if (this.isSpinning || this.getItemsCount() < 2) return null;
        
        this.isSpinning = true;
        // Add spinning class to wheel container
        this.canvas.closest('.wheel').classList.add('spinning');
        
        const duration = 5000;
        const startTime = Date.now();
        const startRotation = this.rotation;

        // For weighted wheel, calculate the target rotation to land on weighted random selection
        let targetRotation;
        if (this.isWeighted) {
            const winningIndex = this.getWeightedRandomIndex();
            const totalWeight = this.weightedItems.reduce((sum, item) => sum + item.weight, 0);
            let angleSum = 0;
            
            // Calculate the angle to the middle of the winning segment
            for (let i = 0; i < winningIndex; i++) {
                angleSum += (this.weightedItems[i].weight / totalWeight) * (2 * Math.PI);
            }
            // Add half of the winning segment's angle
            angleSum += (this.weightedItems[winningIndex].weight / totalWeight) * Math.PI;
            
            // Calculate final target rotation
            targetRotation = 2 * Math.PI * this.targetRotations + (2 * Math.PI - angleSum);
        } else {
            const randomIndex = Math.floor(Math.random() * this.items.length);
            const sliceAngle = (2 * Math.PI) / this.items.length;
            targetRotation = 2 * Math.PI * this.targetRotations + (2 * Math.PI - (randomIndex * sliceAngle + sliceAngle / 2));
        }

        return new Promise((resolve) => {
            const animate = () => {
                const currentTime = Date.now();
                const elapsed = currentTime - startTime;

                if (elapsed < duration) {
                    const progress = Math.min(elapsed / duration, 1);
                    
                    const easing = 1 - Math.pow(1 - progress, 4);
                    this.rotation = startRotation + targetRotation * easing;
                    this.draw();

                    requestAnimationFrame(animate);
                } else {
                    this.isSpinning = false;
                    // Remove spinning class when done
                    this.canvas.closest('.wheel').classList.remove('spinning');
                    
                    const finalRotation = this.rotation % (2 * Math.PI);
                    
                    if (this.isWeighted) {
                        const totalWeight = this.weightedItems.reduce((sum, item) => sum + item.weight, 0);
                        let currentAngle = 0;
                        let winningIndex = 0;
                        
                        // Find which segment contains the top position (0 radians)
                        const normalizedRotation = (2 * Math.PI - finalRotation) % (2 * Math.PI);
                        for (let i = 0; i < this.weightedItems.length; i++) {
                            const sliceAngle = (2 * Math.PI * this.weightedItems[i].weight) / totalWeight;
                            if (normalizedRotation >= currentAngle && 
                                normalizedRotation < currentAngle + sliceAngle) {
                                winningIndex = i;
                                break;
                            }
                            currentAngle += sliceAngle;
                        }
                        resolve(this.weightedItems[winningIndex].name);
                    } else {
                        const sliceAngle = (2 * Math.PI) / this.items.length;
                        const normalizedRotation = (2 * Math.PI - finalRotation) % (2 * Math.PI);
                        const winningIndex = Math.floor(normalizedRotation / sliceAngle);
                        resolve(this.getItem(winningIndex));
                    }
                }
            };
            animate();
        });
    }
}

// Initialize wheels
const tableWheel = new WheelController('tableCanvas');
const prizeWheel = new WheelController('prizeCanvas');
prizeWheel.isWeighted = true;

// Add table number
function addTableNumber() {
    const input = document.getElementById('tableInput');
    const tableNumbers = input.value.split(',').map(num => num.trim());
    
    if (tableNumbers.length > 0) {
        tableNumbers.forEach(number => {
            if (number && !isNaN(number) && !tableWheel.items.includes(Number(number))) {
                tableWheel.items.push(Number(number));
            }
        });
        
        updateList('tableList', tableWheel.items);
        tableWheel.draw();
        input.value = '';
    }
}

// Update display lists
function updateList(elementId, items) {
    const element = document.getElementById(elementId);
    const sideElement = document.getElementById(elementId + '-side');
    const itemsHtml = Array.isArray(items) 
        ? items.map(item => `<span>${item}</span>`).join('')
        : '';
    
    if (element) {
        element.innerHTML = itemsHtml;
    }
    if (sideElement) {
        sideElement.innerHTML = itemsHtml;
    }
}

// Add prize with percentage weight
function addPrize() {
    const input = document.getElementById('prizeInput');
    const prizeEntries = input.value.split(',').map(entry => entry.trim());
    
    if (prizeEntries.length > 0) {
        let totalWeight = prizeWheel.weightedItems.reduce((sum, item) => sum + item.weight, 0);
        let addedAny = false;
        
        prizeEntries.forEach(entry => {
            const match = entry.match(/(.+)\((\d+)\)/);
            if (match) {
                const name = match[1].trim();
                const weight = parseInt(match[2]);
                
                if (totalWeight + weight <= 100) {
                    const existingIndex = prizeWheel.weightedItems.findIndex(item => item.name === name);
                    if (existingIndex === -1) {
                        prizeWheel.weightedItems.push({ name, weight });
                        totalWeight += weight;
                        addedAny = true;
                    }
                } else {
                    alert(`${name} eklenemiyor. Ağırlık ${weight}% ile toplam 100%'ü aşıyor.`);
                }
            } else {
                alert('Lütfen doğru formatta girin: isim(ağırlık) - Örnek: çay(50)');
            }
        });
        
        if (addedAny) {
            // Update both lists with only the prize names
            const prizeList = prizeWheel.weightedItems.map(item => item.name);
            updateList('prizeList', prizeList);
            updateList('prizeList-side', prizeList);
            prizeWheel.draw();
        }
        
        input.value = '';
    }
}

// Add these functions at the top of the file
function createConfettiCannon() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
    }, 250);
}

// Update the spinWheels function
async function spinWheels() {
    if (tableWheel.items.length < 2 || prizeWheel.weightedItems.length < 2) {
        alert('Lütfen her çarka en az 2 öğe ekleyin!');
        return;
    }

    const spinButton = document.getElementById('spinButton');
    spinButton.disabled = true;

    // Synchronize the wheels by using the same random value
    const rotations = 4 + Math.random() * 4;
    tableWheel.targetRotations = rotations;
    prizeWheel.targetRotations = rotations;

    const [tableResult, prizeResult] = await Promise.all([
        tableWheel.spin(),
        prizeWheel.spin()
    ]);

    // Play winning sound
    const winSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
    winSound.play();

    // Trigger confetti
    createConfettiCannon();

    const resultDisplay = document.getElementById('result');
    resultDisplay.style.display = 'block';
    resultDisplay.innerHTML = `
        <h2>🎉 Tebrikler! 🎉</h2>
        <p class="winner-text">Masa ${tableResult} kazandı: ${prizeResult}!</p>
    `;

    spinButton.disabled = false;
}

// Initial draw
tableWheel.draw();
prizeWheel.draw(); 