const canvas = document.getElementById('profileCanvas');
const ctx = canvas.getContext('2d');

const explosion = {
    x: null,
    y: null,
    radius: 20,
    active: false
};

let particles = [];
let imageData;
let fastSettling = false;

const canvasExtraSpace = 40;
const imgOffsetTop = 20;
const imgOffsetLeft = 20;
const imgZoom = 1.0;

const image = new Image();
image.src = 'assets/images/pfp.png';

image.onload = function() {
    init();
    animate();
};

function init() {
    const baseImgWidth = 128;
    const baseImgHeight = 128;
    
    const imgWidth = baseImgWidth * imgZoom;
    const imgHeight = baseImgHeight * imgZoom;
    
    canvas.width = baseImgWidth + canvasExtraSpace;
    canvas.height = baseImgHeight + canvasExtraSpace;
    
    ctx.drawImage(image, imgOffsetLeft, imgOffsetTop, imgWidth, imgHeight);
    imageData = ctx.getImageData(imgOffsetLeft, imgOffsetTop, Math.min(imgWidth, baseImgWidth), Math.min(imgHeight, baseImgHeight));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles = [];
    const gap = 1;
    
    const sampledWidth = Math.min(imgWidth, baseImgWidth);
    const sampledHeight = Math.min(imgHeight, baseImgHeight);
    
    for (let y = 0; y < sampledHeight; y += gap) {
        for (let x = 0; x < sampledWidth; x += gap) {
            const index = (y * Math.floor(sampledWidth) + x) * 4;
            const red = imageData.data[index];
            const green = imageData.data[index + 1];
            const blue = imageData.data[index + 2];
            const alpha = imageData.data[index + 3];
            
            if (alpha > 128) {
                particles.push(new Particle(x + imgOffsetLeft, y + imgOffsetTop, red, green, blue, alpha));
            }
        }
    }
}

class Particle {
    constructor(x, y, red, green, blue, alpha) {
        this.originX = x;
        this.originY = y;
        const offsetRange = 3;
        this.x = x + (Math.random() - 0.5) * offsetRange;
        this.y = y + (Math.random() - 0.5) * offsetRange;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha / 255;
        this.size = 1;
        this.friction = 0.85;
        this.springStrength = 0.0003;
        this.damping = 0.995;
    }
    
    scramble() {
        const offsetRange = 8;
        this.x = this.originX + (Math.random() - 0.5) * offsetRange;
        this.y = this.originY + (Math.random() - 0.5) * offsetRange;
        this.vx = 0;
        this.vy = 0;
    }
    
    update(particles, index) {
        if (explosion.active) {
            const dx = this.x - explosion.x;
            const dy = this.y - explosion.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < explosion.radius) {
                const force = (explosion.radius - distance) / explosion.radius;
                const angle = Math.atan2(dy, dx);
                const variation = 0.8 + Math.random() * 0.4;
                const pushStrength = 2 * variation;
                const pushX = Math.cos(angle) * force * pushStrength;
                const pushY = Math.sin(angle) * force * pushStrength;
                this.vx += pushX;
                this.vy += pushY;
            }
        }
        
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 0.5) {
            const wakeRange = 15;
            const wakeStrength = 0.15;
            const startIdx = Math.max(0, index - 20);
            const endIdx = Math.min(particles.length, index + 20);
            
            for (let i = startIdx; i < endIdx; i += 2) {
                if (i === index) continue;
                const other = particles[i];
                const otherSpeed = Math.sqrt(other.vx * other.vx + other.vy * other.vy);
                
                if (otherSpeed < 0.1) {
                    const dx = other.x - this.x;
                    const dy = other.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < wakeRange && dist > 1) {
                        const influence = (wakeRange - dist) / wakeRange;
                        const wakeX = (this.vx / speed) * wakeStrength * influence;
                        const wakeY = (this.vy / speed) * wakeStrength * influence;
                        other.vx += wakeX;
                        other.vy += wakeY;
                    }
                }
            }
        }
        
        const distFromOrigin = Math.sqrt(
            Math.pow(this.x - this.originX, 2) + 
            Math.pow(this.y - this.originY, 2)
        );
        
        if (distFromOrigin > 1) {
            const cohesionRange = 40;
            const cohesionStrength = 0.005;
            let avgVx = 0;
            let avgVy = 0;
            let count = 0;
            
            const startIdx = Math.max(0, index - 30);
            const endIdx = Math.min(particles.length, index + 30);
            
            for (let i = startIdx; i < endIdx; i += 3) {
                if (i === index) continue;
                const other = particles[i];
                const dx = other.x - this.x;
                const dy = other.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < cohesionRange && dist > 1) {
                    avgVx += other.vx;
                    avgVy += other.vy;
                    count++;
                }
            }
            
            if (count > 0) {
                avgVx /= count;
                avgVy /= count;
                this.vx += (avgVx - this.vx) * cohesionStrength;
                this.vy += (avgVy - this.vy) * cohesionStrength;
            }
        }
        
        const springX = (this.originX - this.x) * this.springStrength;
        const springY = (this.originY - this.y) * this.springStrength;
        this.vx += springX;
        this.vy += springY;
        
        const currentDamping = fastSettling ? 0.95 : this.damping;
        this.vx *= currentDamping;
        this.vy *= currentDamping;
        
        this.x += this.vx;
        this.y += this.vy;
    }
    
    draw() {
        ctx.fillStyle = `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha * 0.7})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update(particles, i);
        particles[i].draw();
    }
    
    if (explosion.active) {
        explosion.active = false;
    }
    
    requestAnimationFrame(animate);
}

canvas.addEventListener('mousemove', function(e) {
    setExplosionFromPoint(e.clientX, e.clientY);
});

canvas.addEventListener('mouseleave', function() {
    explosion.active = false;
});

function setExplosionFromPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    explosion.x = (clientX - rect.left) * scaleX;
    explosion.y = (clientY - rect.top) * scaleY;
    explosion.active = true;
}

function isPointInCircle(clientX, clientY) {
    const el = canvas.parentElement || canvas;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = Math.min(rect.width, rect.height) / 2;
    const dist = Math.sqrt((clientX - cx) ** 2 + (clientY - cy) ** 2);
    return dist <= radius;
}

let touchIdOnCanvas = null;

canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        if (isPointInCircle(touch.clientX, touch.clientY)) {
            touchIdOnCanvas = touch.identifier;
            setExplosionFromPoint(touch.clientX, touch.clientY);
            e.preventDefault();
        }
    }
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
    if (touchIdOnCanvas !== null) {
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === touchIdOnCanvas) {
                setExplosionFromPoint(e.touches[i].clientX, e.touches[i].clientY);
                e.preventDefault();
                break;
            }
        }
    }
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
    if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchIdOnCanvas) {
                touchIdOnCanvas = null;
                explosion.active = false;
                break;
            }
        }
    }
});

canvas.addEventListener('touchcancel', function(e) {
    if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchIdOnCanvas) {
                touchIdOnCanvas = null;
                explosion.active = false;
                break;
            }
        }
    }
});

const profileImage = document.querySelector('.profile-image');
if (profileImage) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (profileImage.classList.contains('flipping')) {
                    fastSettling = true;
                    setTimeout(() => {
                        for (let i = 0; i < particles.length; i++) {
                            particles[i].scramble();
                        }
                        fastSettling = false;
                    }, 400);
                }
            }
        });
    });
    
    observer.observe(profileImage, {
        attributes: true,
        attributeFilter: ['class']
    });
}
