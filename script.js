const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const uiElement = document.getElementById('ui');
if (!uiElement) console.error("CRITICAL ERROR: UI element (#ui) not found in HTML!");

const mainMenuEl = document.getElementById('mainMenu');
const startGameButton = document.getElementById('startGameButton');
const settingsButton = document.getElementById('settingsButton');
const settingsMenuEl = document.getElementById('settingsMenu');
const toggleMusicButton = document.getElementById('toggleMusicButton');
const toggleBloodButton = document.getElementById('toggleBloodButton');
const toggleShakeButton = document.getElementById('toggleShakeButton');
const toggleFullscreenButton = document.getElementById('toggleFullscreenButton');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const backButton = document.getElementById('backButton');
const healthOverlayEl = document.getElementById('healthOverlay');

const scoreEl = document.getElementById('score');
const waveEl = document.getElementById('wave');
const levelEl = document.getElementById('level');
const xpEl = document.getElementById('xp');
const xpNextEl = document.getElementById('xpNext');
const healthEl = document.getElementById('health');
const ammoEl = document.getElementById('ammo');
const maxAmmoEl = document.getElementById('maxAmmo');
const shopEl = document.getElementById('shop');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const restartButton = document.getElementById('restartGame');
const buyAmmoButton = document.getElementById('buyAmmo');
const buyHealthButton = document.getElementById('buyHealth');
const upgradeWeaponButton = document.getElementById('upgradeWeapon');
const nextWaveButton = document.getElementById('nextWave');
const waveMessageEl = document.getElementById('waveMessage');
const levelUpScreenEl = document.getElementById('levelUpScreen');
const cardChoicesEl = document.getElementById('cardChoices');

const PLAYER_SPEED = 3.5;
const ZOMBIE_SPEED_NORMAL = 0.9;
const ZOMBIE_SPEED_FAST = 1.7;
const ZOMBIE_SPEED_TANK = 0.5;
const BULLET_SPEED = 10;
const PLAYER_HEALTH_START = 100;
const ZOMBIE_HEALTH_NORMAL = 45;
const ZOMBIE_HEALTH_FAST = 30;
const ZOMBIE_HEALTH_TANK = 120;
const ZOMBIE_BASE_XP = 5;
const BASE_ZOMBIE_SPAWN_COUNT = 4;
const WAVE_DIFFICULTY_MULTIPLIER = 1.4;
const PARTICLE_LIFESPAN = 45;
const STARTING_WEAPON_NAME = "M4A1";
const BLOOD_DECAL_LIFESPAN = 1800;
const BLOOD_DECAL_MAX_ALPHA = 0.7;
const BASE_XP_TO_LEVEL = 75;
const XP_LEVEL_MULTIPLIER = 1.25;
const WALK_ANIMATION_SPEED = 12;
const LOW_HEALTH_THRESHOLD = 0.25;
const HEALTH_OVERLAY_START_THRESHOLD = 0.50;
const HEALTH_OVERLAY_END_THRESHOLD = 0.10;
const MAX_HEALTH_OVERLAY_OPACITY = 0.35;
const HEALTH_PULSE_FREQUENCY = 0.11;
const HEALTH_PULSE_MAGNITUDE_FACTOR = 0.15;
const HEARTBEAT_MAX_VOLUME_MULTIPLIER = 10; // Heartbeat can get louder than normal SFX
const HEARTBEAT_VOLUME_POWER = 2; // Increase volume faster near death (1=linear, 2=squared)
const ZOMBIE_HEALTH_SCALE_PER_WAVE_NORMAL = 12; // Increased from 6
const ZOMBIE_HEALTH_SCALE_PER_WAVE_TANK = 20; // Increased from 10
const AMMO_COST_BASE = 10;
const AMMO_COST_SCALE_PER_WAVE = 2;
const HEALTH_COST_BASE = 20;
const HEALTH_COST_SCALE_PER_WAVE = 3;
const UPGRADE_COST_BASE = 50;
const UPGRADE_COST_SCALE_PER_WAVE = 25; // Increased from 5


let player;
let zombies = [];
let bullets = [];
let particles = [];
let bloodDecals = [];
let score = 0;
let currentWave = 1;
let playerLevel = 1;
let playerExperience = 0;
let experienceToNextLevel = BASE_XP_TO_LEVEL;
let mousePos = { x: 0, y: 0 };
let keys = {};
let isShooting = false;
let shootCooldown = 0;
let isReloading = false;
let reloadTimer = 0;
let gameState = 'menu';
let waveTransitionTimer = 0;
const WAVE_TRANSITION_DELAY = 180;
let activeBuffs = [];

let screenShakeMagnitude = 0;
let screenShakeDuration = 0;
const MAX_SHAKE_OFFSET = 12;

let backgroundMusic = null;
let heartbeatSound = null;
let shotSound = null;
let biteSound = null;
let explosionSound = null;
let clickSound = null;
let waveSound = null;
let levelUpSound = null;
let selectSound = null;
let audioContext = null;
let musicStarted = false;
let heartbeatPlaying = false;
let gameSoundVolume = 0.6;
let isMusicEnabled = true;
let isBloodEnabled = true;
let isScreenShakeEnabled = true;
let healthPulseTimer = 0;


function loadAudio() {
    try {
        backgroundMusic = new Audio('./assets/audio/musica.wav');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.15;

        heartbeatSound = new Audio('./assets/audio/batimento.mp3');
        heartbeatSound.loop = true;
        heartbeatSound.volume = 0;

        shotSound = new Audio('./assets/audio/shot.mp3');
        shotSound.volume = gameSoundVolume;
        biteSound = new Audio('./assets/audio/bite.mp3');
        biteSound.volume = gameSoundVolume;
        explosionSound = new Audio('./assets/audio/explosion.mp3');
        explosionSound.volume = gameSoundVolume;
        clickSound = new Audio('./assets/audio/click.mp3');
        clickSound.volume = gameSoundVolume;
        waveSound = new Audio('./assets/audio/wave.mp3');
        waveSound.volume = gameSoundVolume;
        levelUpSound = new Audio('./assets/audio/wave.mp3');
        levelUpSound.volume = gameSoundVolume;
        selectSound = new Audio('./assets/audio/select.mp3');
        selectSound.volume = gameSoundVolume;

        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (window.AudioContext) {
            audioContext = new AudioContext();
            if (audioContext.state === 'suspended') console.log("AudioContext suspended.");
        } else {
            console.warn("AudioContext not supported.");
        }
        console.log("Audio loaded.");
    } catch (e) {
        console.error("Error loading audio:", e);
        backgroundMusic = heartbeatSound = shotSound = biteSound = explosionSound = clickSound = waveSound = levelUpSound = selectSound = null;
    }
}

function tryStartMusic() {
    if (!isMusicEnabled || musicStarted || !backgroundMusic) return;

    const playPromise = backgroundMusic.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            musicStarted = true;
            console.log("Music started.");
        }).catch(e => {
            if (audioContext && audioContext.state === 'suspended') {
                 console.log("Attempting context resume for music...");
                 audioContext.resume().then(() => {
                     console.log("Context resumed.");
                     if (isMusicEnabled) {
                         backgroundMusic.play().then(() => musicStarted = true).catch(err => console.error("Error playing post-resume:", err));
                     }
                 }).catch(err => console.error("Error resuming:", err));
            } else {
                console.warn("Music autoplay failed:", e);
            }
        });
    }
}

function stopMusic() {
    if (backgroundMusic && !backgroundMusic.paused) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        musicStarted = false;
        console.log("Music stopped.");
    }
}

function updateMusicState() {
    if (isMusicEnabled) {
        if (gameState === 'playing' || gameState === 'waveTransition' || gameState === 'shop' || gameState === 'levelUp') {
            tryStartMusic();
        }
    } else {
        stopMusic();
    }
}

function updateHeartbeatSound() {
    if (!player || !heartbeatSound) return;

    const healthPercent = player.health / player.maxHealth;

    if (healthPercent <= LOW_HEALTH_THRESHOLD && player.health > 0 && gameState !== 'menu' && gameState !== 'settings') {
        const lowHealthIntensity = Math.max(0, 1 - (healthPercent / LOW_HEALTH_THRESHOLD));
        const volumeFactor = Math.pow(lowHealthIntensity, HEARTBEAT_VOLUME_POWER);
        const targetVolume = (gameSoundVolume * HEARTBEAT_MAX_VOLUME_MULTIPLIER) * volumeFactor;
        heartbeatSound.volume = Math.max(0, Math.min(1.0, targetVolume));

        if (heartbeatSound.paused && !heartbeatPlaying) {
            heartbeatPlaying = true;
            const playPromise = heartbeatSound.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.warn("Heartbeat play failed:", e);
                    heartbeatPlaying = false;
                     if (audioContext && audioContext.state === 'suspended') {
                         console.log("Attempting context resume for heartbeat...");
                         audioContext.resume().then(() => {
                            console.log("Context resumed for heartbeat.");
                            if(player.health / player.maxHealth <= LOW_HEALTH_THRESHOLD) {
                                heartbeatSound.play().catch(err => console.error("Error playing heartbeat post-resume:", err));
                            } else {
                                heartbeatPlaying = false;
                            }
                         }).catch(err => { console.error("Error resuming context:", err); heartbeatPlaying = false; });
                    }
                });
            } else {
                heartbeatPlaying = false;
            }
        } else if (!heartbeatSound.paused) {
             heartbeatPlaying = true;
        }

    } else {
        if (!heartbeatSound.paused) {
            heartbeatSound.pause();
             heartbeatSound.currentTime = 0;
            console.log("Heartbeat stopped.");
        }
        heartbeatSound.volume = 0;
        heartbeatPlaying = false;
    }
}


function updateHealthOverlay() {
    if (!player || !healthOverlayEl) return;

    const healthPercent = player.health / player.maxHealth;
    let baseOpacity = 0;

    if (healthPercent <= HEALTH_OVERLAY_START_THRESHOLD && player.health > 0) {
        const range = HEALTH_OVERLAY_START_THRESHOLD - HEALTH_OVERLAY_END_THRESHOLD;
        const progressInRange = Math.max(0, HEALTH_OVERLAY_START_THRESHOLD - healthPercent);
        const rangePercent = range > 0 ? Math.min(1, progressInRange / range) : (healthPercent <= HEALTH_OVERLAY_END_THRESHOLD ? 1 : 0);
        baseOpacity = MAX_HEALTH_OVERLAY_OPACITY * rangePercent;
    }

    let pulseModulation = 0;

    if (healthPercent <= LOW_HEALTH_THRESHOLD && player.health > 0) {
        pulseModulation = ((Math.sin(healthPulseTimer) + 1) / 2) * HEALTH_PULSE_MAGNITUDE_FACTOR * baseOpacity;
    }


    const finalOpacity = Math.max(0, baseOpacity - pulseModulation);

    healthOverlayEl.style.backgroundColor = `rgba(255, 0, 0, ${Math.min(MAX_HEALTH_OVERLAY_OPACITY, finalOpacity)})`;
}


function setGameSoundVolume(volume) {
    gameSoundVolume = parseFloat(volume);
    if (shotSound) shotSound.volume = gameSoundVolume;
    if (biteSound) biteSound.volume = gameSoundVolume;
    if (explosionSound) explosionSound.volume = gameSoundVolume;
    if (clickSound) clickSound.volume = gameSoundVolume;
    if (waveSound) waveSound.volume = gameSoundVolume;
    if (levelUpSound) levelUpSound.volume = gameSoundVolume;
    if (selectSound) selectSound.volume = gameSoundVolume;

    if (volumeValue) volumeValue.textContent = Math.round(gameSoundVolume * 100);
    localStorage.setItem('gameSoundVolume', gameSoundVolume);
    updateHeartbeatSound();
}

function playSound(sound) {
    if (!sound) return;
    if (audioContext && audioContext.state === 'suspended') {
        console.warn("Audio suspended.");
        return;
    }
    sound.volume = gameSoundVolume;
    sound.currentTime = 0;
    sound.play().catch(e => console.warn("Sound play failed:", e));
}

function playShotSound() { playSound(shotSound); }
function playBiteSound() { playSound(biteSound); }
function playExplosionSound() { playSound(explosionSound); }
function playClickSound() { playSound(clickSound); }
function playWaveSound() { playSound(waveSound); }
function playLevelUpSound() { playSound(levelUpSound); }
function playSelectSound() { playSound(selectSound); }


const WEAPONS = { "M4A1": { damage: 13, ammoCapacity: 30, fireRate: 11, reloadTime: 250, bulletImgSrc: './assets/bullet.svg', bulletWidth: 4, bulletHeight: 6, cost: 0, bulletGlowColor: 'rgba(255, 235, 59, 0.6)', bulletGlowBlur: 6 }, "Shotgun": { damage: 9, ammoCapacity: 8, fireRate: 45, reloadTime: 95, pellets: 6, spread: 0.35, bulletImgSrc: './assets/bullet.svg', bulletWidth: 4, bulletHeight: 6, cost: 150, bulletGlowColor: 'rgba(255, 160, 0, 0.6)', bulletGlowBlur: 5 } };
let currentWeaponName = STARTING_WEAPON_NAME; let weaponStats = { ...WEAPONS[currentWeaponName] }; weaponStats.currentAmmo = weaponStats.ammoCapacity; const bulletImg = new Image(); bulletImg.src = weaponStats.bulletImgSrc;


const playerImgIdle = new Image(); playerImgIdle.src = './assets/player_idle.svg';
const playerImgWalk1 = new Image(); playerImgWalk1.src = './assets/player_walk1.svg';
const playerImgWalk2 = new Image(); playerImgWalk2.src = './assets/player_walk2.svg';


const zombieNormalImgIdle = new Image(); zombieNormalImgIdle.src = './assets/zombie_normal_idle.svg';
const zombieNormalImgWalk1 = new Image(); zombieNormalImgWalk1.src = './assets/zombie_normal_walk1.svg';
const zombieNormalImgWalk2 = new Image(); zombieNormalImgWalk2.src = './assets/zombie_normal_walk2.svg';

const zombieFastImgIdle = new Image(); zombieFastImgIdle.src = './assets/zombie_fast_idle.svg';
const zombieFastImgWalk1 = new Image(); zombieFastImgWalk1.src = './assets/zombie_fast_walk1.svg';
const zombieFastImgWalk2 = new Image(); zombieFastImgWalk2.src = './assets/zombie_fast_walk2.svg';

const zombieTankImgIdle = new Image(); zombieTankImgIdle.src = './assets/zombie_tank_idle.svg';
const zombieTankImgWalk1 = new Image(); zombieTankImgWalk1.src = './assets/zombie_tank_walk1.svg';
const zombieTankImgWalk2 = new Image(); zombieTankImgWalk2.src = './assets/zombie_tank_walk2.svg';


const AVAILABLE_BUFFS = [
    { id: 'max_health_1', name: 'Iron Skin', description: '+15 Max Health', icon: './assets/icons/icon_health.svg', maxLevel: 5, currentLevel: 0, apply: (p, ws) => { p.maxHealth += 15; p.health += 15; } },
    { id: 'move_speed_1', name: 'Swift Boots', description: '+7% Movement Speed', icon: './assets/icons/icon_speed.svg', maxLevel: 5, currentLevel: 0, apply: (p, ws) => { p.speed *= 1.07; } },
    { id: 'reload_speed_1', name: 'Quick Hands', description: '-10% Reload Time', icon: './assets/icons/icon_reload.svg', maxLevel: 5, currentLevel: 0, apply: (p, ws) => { ws.reloadTime = Math.max(15, Math.floor(ws.reloadTime * 0.9)); } },
    { id: 'damage_1', name: 'Sharp Shooter', description: '+8% Damage', icon: './assets/icons/icon_damage.svg', maxLevel: 5, currentLevel: 0, apply: (p, ws) => { ws.damage = Math.round(ws.damage * 1.08); } },
    { id: 'fire_rate_1', name: 'Rapid Fire', description: '-8% Fire Cooldown', icon: './assets/icons/icon_firerate.svg', maxLevel: 5, currentLevel: 0, apply: (p, ws) => { ws.fireRate = Math.max(3, Math.floor(ws.fireRate * 0.92)); } },
    { id: 'ammo_capacity_1', name: 'Extra Pouches', description: '+15% Ammo Capacity', icon: './assets/icons/icon_ammo.svg', maxLevel: 5, currentLevel: 0, apply: (p, ws) => { ws.ammoCapacity = Math.ceil(ws.ammoCapacity * 1.15); ws.currentAmmo = Math.min(ws.ammoCapacity, ws.currentAmmo + Math.ceil(ws.ammoCapacity * 0.15)) } },
    { id: 'health_regen_1', name: 'Regeneration', description: '+1 HP/sec', icon: './assets/icons/icon_regen.svg', maxLevel: 3, currentLevel: 0, apply: (p, ws) => { p.healthRegen = (p.healthRegen || 0) + 1; } },
];

class Entity { constructor(x, y, width, height, health) { this.x = x; this.y = y; this.width = width; this.height = height; this.health = health; this.maxHealth = health; this.angle = 0; this.isMoving = false; this.walkFrame = 0; this.walkAnimTimer = 0; this.imgIdle = null; this.imgWalk1 = null; this.imgWalk2 = null;} collidesWith(other) { return this.x < other.x + other.width && this.x + this.width > other.x && this.y < other.y + other.height && this.y + this.height > other.y; } getCenterX() { return this.x + this.width / 2; } getCenterY() { return this.y + this.height / 2; } updateAnimation(didMove) { this.isMoving = didMove; if (this.isMoving) { this.walkAnimTimer++; if (this.walkAnimTimer >= WALK_ANIMATION_SPEED) { this.walkFrame = (this.walkFrame + 1) % 2; this.walkAnimTimer = 0; } } else { this.walkAnimTimer = 0;} } drawSelf() { let imageToDraw = this.imgIdle; if (this.isMoving) { imageToDraw = this.walkFrame === 0 ? this.imgWalk1 : this.imgWalk2; } ctx.save(); ctx.translate(this.getCenterX(), this.getCenterY()); ctx.rotate(this.angle + Math.PI / 2); if(imageToDraw) { ctx.drawImage(imageToDraw, -this.width / 2, -this.height / 2, this.width, this.height); } ctx.restore(); } }

class Player extends Entity { constructor(x, y) { super(x, y, 16, 16, PLAYER_HEALTH_START); this.speed = PLAYER_SPEED; this.healthRegen = 0; this.regenTimer = 0; this.imgIdle = playerImgIdle; this.imgWalk1 = playerImgWalk1; this.imgWalk2 = playerImgWalk2; } update() { let dx = 0, dy = 0; if (keys['w'] || keys['arrowup']) dy -= 1; if (keys['s'] || keys['arrowdown']) dy += 1; if (keys['a'] || keys['arrowleft']) dx -= 1; if (keys['d'] || keys['arrowright']) dx += 1; const mag = Math.sqrt(dx * dx + dy * dy); let moved = false; if (mag > 0) { const moveSpeed = this.speed; dx = (dx / mag) * moveSpeed; dy = (dy / mag) * moveSpeed; this.x += dx; this.y += dy; moved = true; } this.updateAnimation(moved); this.x = Math.max(0, Math.min(canvas.width - this.width, this.x)); this.y = Math.max(0, Math.min(canvas.height - this.height, this.y)); this.angle = Math.atan2(mousePos.y - this.getCenterY(), mousePos.x - this.getCenterX()); if (shootCooldown > 0) shootCooldown--; if (isReloading) { reloadTimer--; if (reloadTimer <= 0) { weaponStats.currentAmmo = weaponStats.ammoCapacity; isReloading = false; updateUI(); } } if (isShooting && shootCooldown <= 0 && !isReloading && weaponStats.currentAmmo > 0 && gameState === 'playing') { this.shoot(); shootCooldown = weaponStats.fireRate; weaponStats.currentAmmo--; updateUI(); if (weaponStats.currentAmmo === 0) startReload(); } if (this.healthRegen > 0) { this.regenTimer++; if (this.regenTimer >= 60) { this.health = Math.min(this.maxHealth, this.health + this.healthRegen); this.regenTimer = 0; updateUI(); } } } shoot() { playShotSound(); const muzzleX = this.getCenterX() + Math.cos(this.angle) * (this.width * 0.7); const muzzleY = this.getCenterY() + Math.sin(this.angle) * (this.height * 0.7); createParticles(muzzleX, muzzleY, 7, 'muzzleFlash'); triggerScreenShake(1, 3); const currentWeapon = WEAPONS[currentWeaponName]; if (currentWeapon.pellets) { for (let i = 0; i < currentWeapon.pellets; i++) { const angleOffset = (Math.random() - 0.5) * currentWeapon.spread; bullets.push(new Bullet(muzzleX, muzzleY, this.angle + angleOffset, weaponStats.damage, weaponStats)); } } else { const angleOffset = (currentWeapon.spread ? (Math.random() - 0.5) * currentWeapon.spread : 0); bullets.push(new Bullet(muzzleX, muzzleY, this.angle + angleOffset, weaponStats.damage, weaponStats)); } } takeDamage(amount) { this.health -= amount; updateUI(); triggerScreenShake(6, 18); if (this.health <= 0) gameOver(); createParticles(this.getCenterX(), this.getCenterY(), 12, 'blood'); } draw() { this.drawSelf(); } }

class Zombie extends Entity {
    constructor(x, y, type = 'normal') {
        let baseHealth, speed, damage, scoreValue, xpValue, attackCooldown;
        let imgIdle, imgWalk1, imgWalk2;
        const size = 16;

        switch(type) {
            case 'fast':
                baseHealth = ZOMBIE_HEALTH_FAST;
                speed = ZOMBIE_SPEED_FAST;
                damage = 8;
                imgIdle = zombieFastImgIdle;
                imgWalk1 = zombieFastImgWalk1;
                imgWalk2 = zombieFastImgWalk2;
                scoreValue = 15;
                xpValue = ZOMBIE_BASE_XP * 1.2;
                attackCooldown = 45;
                break;
            case 'tank':
                baseHealth = ZOMBIE_HEALTH_TANK;
                speed = ZOMBIE_SPEED_TANK;
                damage = 15;
                imgIdle = zombieTankImgIdle;
                imgWalk1 = zombieTankImgWalk1;
                imgWalk2 = zombieTankImgWalk2;
                scoreValue = 25;
                xpValue = ZOMBIE_BASE_XP * 2;
                attackCooldown = 80;
                break;
            case 'normal':
            default:
                baseHealth = ZOMBIE_HEALTH_NORMAL;
                speed = ZOMBIE_SPEED_NORMAL;
                damage = 7;
                imgIdle = zombieNormalImgIdle;
                imgWalk1 = zombieNormalImgWalk1;
                imgWalk2 = zombieNormalImgWalk2;
                scoreValue = 10;
                xpValue = ZOMBIE_BASE_XP;
                attackCooldown = 65;
                break;
        }
        const healthPerWaveBonus = (type === 'tank' ? ZOMBIE_HEALTH_SCALE_PER_WAVE_TANK : ZOMBIE_HEALTH_SCALE_PER_WAVE_NORMAL);
        const finalHealth = Math.round(baseHealth + (currentWave - 1) * healthPerWaveBonus * (1 + (currentWave-1)*0.05)); // Slightly exponential increase

        super(x, y, size, size, finalHealth);
        this.type = type;
        this.speed = speed * (1 + Math.random() * 0.1); // Keep speed random variation
        this.damage = damage;
        this.attackCooldown = attackCooldown;
        this.currentAttackCooldown = Math.random() * this.attackCooldown;
        this.scoreValue = scoreValue;
        this.xpValue = Math.round(xpValue);
        this.pushForce = 0.2;
        this.imgIdle = imgIdle;
        this.imgWalk1 = imgWalk1;
        this.imgWalk2 = imgWalk2;
    }
    update() { if (!player || gameState !== 'playing') return; const prevX = this.x; const prevY = this.y; const dx = player.getCenterX() - this.getCenterX(); const dy = player.getCenterY() - this.getCenterY(); this.angle = Math.atan2(dy, dx); const magnitude = Math.sqrt(dx * dx + dy * dy); zombies.forEach(otherZombie => { if (this !== otherZombie && this.collidesWith(otherZombie)) { const pushAngle = Math.atan2(this.getCenterY() - otherZombie.getCenterY(), this.getCenterX() - otherZombie.getCenterX()); this.x += Math.cos(pushAngle) * this.pushForce; this.y += Math.sin(pushAngle) * this.pushForce;} }); const attackRange = this.width / 2 + player.width / 2 + 2; if (magnitude > attackRange) { this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed; } else { if (this.currentAttackCooldown <= 0) { player.takeDamage(this.damage); playBiteSound(); this.currentAttackCooldown = this.attackCooldown; createParticles(player.getCenterX(), player.getCenterY(), 4, 'blood'); } } if(this.currentAttackCooldown > 0) this.currentAttackCooldown--; this.x = Math.max(-this.width * 2, Math.min(canvas.width + this.width * 2, this.x)); this.y = Math.max(-this.height * 2, Math.min(canvas.height + this.height * 2, this.y)); const moved = this.x !== prevX || this.y !== prevY; this.updateAnimation(moved);}
    takeDamage(amount) { this.health -= amount; createParticles(this.getCenterX(), this.getCenterY(), this.type === 'tank' ? 2 : 4, 'blood'); if (this.health <= 0) this.die(); }
    die() { playExplosionSound(); const deathX = this.getCenterX(); const deathY = this.getCenterY(); const index = zombies.indexOf(this); if (index > -1) zombies.splice(index, 1); score += this.scoreValue; gainExperience(this.xpValue); updateUI(); const particleCount = this.type === 'tank' ? 75 : 55; createParticles(deathX, deathY, particleCount, 'zombieDeath'); triggerScreenShake(this.type === 'tank' ? 5 : 3, this.type === 'tank' ? 12 : 10); addBloodDecal(deathX, deathY); if (zombies.length === 0 && gameState === 'playing') startWaveTransition(); }
    draw() { this.drawSelf(); const barWidth = this.width * 0.9; const barHeight = 4; const barX = this.getCenterX() - barWidth / 2; const barY = this.y - 12; const healthPercent = Math.max(0, this.health / this.maxHealth); ctx.fillStyle = 'rgba(80, 0, 0, 0.7)'; ctx.fillRect(barX, barY, barWidth, barHeight); ctx.fillStyle = `rgba(0, 220, 0, ${0.5 + healthPercent * 0.5})`; ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 0.5; ctx.strokeRect(barX, barY, barWidth, barHeight); }
}

class Bullet { constructor(x, y, angle, damage, weaponUsed) { this.x = x; this.y = y; this.width = weaponUsed.bulletWidth; this.height = weaponUsed.bulletHeight; this.speed = BULLET_SPEED; this.angle = angle; this.damage = damage; this.vx = Math.cos(angle) * this.speed; this.vy = Math.sin(angle) * this.speed; this.glowColor = weaponUsed.bulletGlowColor || null; this.glowBlur = weaponUsed.bulletGlowBlur || 0; this.image = bulletImg; } update() { this.x += this.vx; this.y += this.vy; } collidesWith(entity) { const halfWidth = this.width / 2; const halfHeight = this.height / 2; return this.x - halfWidth < entity.x + entity.width && this.x + halfWidth > entity.x && this.y - halfHeight < entity.y + entity.height && this.y + halfHeight > entity.y; } draw() { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle + Math.PI / 2); if (this.glowColor && this.glowBlur > 0) { ctx.shadowColor = this.glowColor; ctx.shadowBlur = this.glowBlur; } ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height); ctx.restore(); } }
class Particle { constructor(x, y, type, colorOverride = null) { this.x = x; this.y = y; this.lifespan = PARTICLE_LIFESPAN * (Math.random() * 0.5 + 0.75); this.vx = Math.random() * 6 - 3; this.vy = Math.random() * 6 - 3; this.size = Math.random() * 3 + 1; this.type = type; this.gravity = 0; this.drag = 0.97; this.rotation = Math.random() * Math.PI * 2; this.rotationSpeed = (Math.random() - 0.5) * 0.1; let r, g, b, a; switch(type) { case 'blood': if (!isBloodEnabled) return; r = Math.floor(150 + Math.random() * 60); g = Math.floor(Math.random() * 15); b = Math.floor(Math.random() * 15); a = Math.min(1, Math.random() * 0.6 + 0.4); this.color = colorOverride || `rgba(${r}, ${g}, ${b}, ${a})`; this.gravity = 0.18; this.size = Math.random() * 4 + 1.5; this.drag = 0.98; break; case 'smoke': r = Math.floor(Math.random()*50+50); g = Math.floor(Math.random()*50+50); b = Math.floor(Math.random()*50+50); a = Math.min(1, Math.random() * 0.3 + 0.1); this.color = `rgba(${r}, ${g}, ${b}, ${a})`; this.vy -= 2; this.gravity = -0.02; this.size = Math.random() * 7 + 5; this.drag = 0.94; this.lifespan *= 1.8; this.rotationSpeed = (Math.random() - 0.5) * 0.02; break; case 'muzzleFlash': r = 255; g = Math.floor(Math.random() * 80 + 175); b = Math.floor(Math.random()*50); a = Math.min(1, Math.random() * 0.7 + 0.3); this.color = `rgba(${r}, ${g}, ${b}, ${a})`; this.lifespan *= 0.2; const flashSpeed = 4; if(player){this.vx = Math.cos(player.angle + Math.random()*0.3 - 0.15) * (Math.random()*4+flashSpeed); this.vy = Math.sin(player.angle + Math.random()*0.3 - 0.15) * (Math.random()*4+flashSpeed);} this.size = Math.random() * 6 + 4; this.drag = 0.88; break; case 'zombieDeath': if (!isBloodEnabled) return; r = Math.floor(130 + Math.random() * 80); g = Math.floor(Math.random() * 20); b = Math.floor(Math.random() * 20); a = Math.min(1, Math.random() * 0.6 + 0.45); this.color = `rgba(${r}, ${g}, ${b}, ${a})`; this.gravity = 0.35; this.size = Math.random() * 5.5 + 3.5; const burstSpeed = 7 + Math.random() * 5; const angle = Math.random() * Math.PI * 2; this.vx = Math.cos(angle) * burstSpeed * (0.6 + Math.random() * 0.8); this.vy = Math.sin(angle) * burstSpeed * (0.6 + Math.random() * 0.8) - (2.5 + Math.random() * 3.5); this.lifespan = (PARTICLE_LIFESPAN * 0.55) + (Math.random() * PARTICLE_LIFESPAN * 0.45); this.drag = 0.93; this.sizeReduction = 0.96; this.rotationSpeed = (Math.random() - 0.5) * 0.2; break; default: r = 200; g = 200; b = 200; a = Math.min(1, Math.random() * 0.5 + 0.5); this.color = `rgba(${r}, ${g}, ${b}, ${a})`; } if(!this.color) {this.lifespan = 0; return;} const rgbaMatch = this.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/); this.initialAlpha = rgbaMatch && rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1.0; this.maxLifespan = this.lifespan; } update() { this.lifespan--; this.vx *= this.drag; this.vy *= this.drag; this.vy += this.gravity; this.x += this.vx; this.y += this.vy; this.rotation += this.rotationSpeed; this.alpha = this.maxLifespan > 0 ? Math.max(0, (this.lifespan / this.maxLifespan) * this.initialAlpha) : 0; this.size *= (this.sizeReduction || 0.985); this.size = Math.max(0, this.size); } draw() { if (this.lifespan <= 0) return; const rgbaMatch = this.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/); if (rgbaMatch) { const r = rgbaMatch[1]; const g = rgbaMatch[2]; const b = rgbaMatch[3]; const finalAlpha = isNaN(this.alpha) ? 0 : Math.max(0, Math.min(1, this.alpha)); ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalAlpha})`; ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation); ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size); ctx.restore(); } else { console.warn("Could not parse particle color:", this.color); } } }

function addBloodDecal(x, y) {
    if (!isBloodEnabled) return;
    const decal = { x: x + (Math.random() - 0.5) * 5, y: y + (Math.random() - 0.5) * 5, lifespan: BLOOD_DECAL_LIFESPAN + Math.random() * 600 - 300, maxLifespan: 0, alpha: BLOOD_DECAL_MAX_ALPHA, rotation: Math.random() * Math.PI * 2, splats: Array.from({length: 6 + Math.floor(Math.random()*5)}, () => { const r = 130 + Math.floor(Math.random() * 41); const g = 0; const b = Math.floor(Math.random() * 10); const a = Math.min(1, 0.7 + Math.random() * 0.3); return { offsetX: (Math.random() - 0.5) * 25, offsetY: (Math.random() - 0.5) * 25, radius: 2 + Math.random() * 4, color: `rgba(${r}, ${g}, ${b}, ${a})` }; }) }; decal.maxLifespan = decal.lifespan; bloodDecals.push(decal); }

function createParticles(x, y, count, type, colorOverride = null) {
    if ((type === 'blood' || type === 'zombieDeath') && !isBloodEnabled) return;
    for (let i = 0; i < count; i++) {
         const p = new Particle(x, y, type, colorOverride);
         if(p.lifespan > 0) particles.push(p);
    }
}
function spawnZombie() { let spawnX, spawnY; const edge = Math.floor(Math.random() * 4); const buffer = 50; switch (edge) { case 0: spawnX = Math.random() * canvas.width; spawnY = -buffer; break; case 1: spawnX = canvas.width + buffer; spawnY = Math.random() * canvas.height; break; case 2: spawnX = Math.random() * canvas.width; spawnY = canvas.height + buffer; break; case 3: spawnX = -buffer; spawnY = Math.random() * canvas.height; break; } let zombieType = 'normal'; const rand = Math.random(); const tankChance = currentWave >= 4 ? Math.min(0.25, 0.05 + (currentWave - 4) * 0.02) : 0; const fastChance = currentWave >= 2 ? Math.min(0.4, 0.1 + (currentWave - 2) * 0.04) : 0; if (rand < tankChance) zombieType = 'tank'; else if (rand < tankChance + fastChance) zombieType = 'fast'; zombies.push(new Zombie(spawnX, spawnY, zombieType)); }
function startWave(waveNum) { currentWave = waveNum; waveEl.textContent = waveNum; const numZombies = Math.floor(BASE_ZOMBIE_SPAWN_COUNT * Math.pow(WAVE_DIFFICULTY_MULTIPLIER, waveNum - 1)); console.log(`Starting Wave ${waveNum}, Spawning ${numZombies} zombies.`); const spawnInterval = Math.max(80, 450 - waveNum * 18); for (let i = 0; i < numZombies; i++) { setTimeout(spawnZombie, i * spawnInterval); } hideShop(); hideWaveMessage(); hideLevelUpScreen(); gameState = 'playing'; showWaveMessage(`Wave ${currentWave} Starting!`); setTimeout(hideWaveMessage, 1500); }
function startReload() { if (!isReloading && weaponStats.currentAmmo < weaponStats.ammoCapacity && gameState === 'playing') { isReloading = true; reloadTimer = weaponStats.reloadTime; console.log(`Reloading ${currentWeaponName}... (${reloadTimer} frames)`); updateUI(); } }

function gainExperience(amount) {
    if (gameState === 'gameOver') return;
    playerExperience += amount;
    console.log(`Gained ${amount} XP. Total: ${playerExperience}/${experienceToNextLevel}`);
    while (playerExperience >= experienceToNextLevel) {
        levelUp();
    }
    updateUI();
}

function calculateNextLevelXP(level) {
    return Math.floor(BASE_XP_TO_LEVEL * Math.pow(XP_LEVEL_MULTIPLIER, level - 1));
}

function levelUp() {
    playerLevel++;
    playerExperience -= experienceToNextLevel;
    experienceToNextLevel = calculateNextLevelXP(playerLevel);
    console.log(`Leveled Up! Level: ${playerLevel}, Next XP: ${experienceToNextLevel}`);
    playLevelUpSound();
    triggerLevelUpChoice();
    updateUI();
}

function triggerLevelUpChoice() {
    if (gameState === 'gameOver') return;
    gameState = 'levelUp';
    isShooting = false;

    const availableChoices = AVAILABLE_BUFFS.filter(buff => buff.currentLevel < buff.maxLevel);
    const choices = availableChoices.sort(() => 0.5 - Math.random()).slice(0, 3);

    cardChoicesEl.innerHTML = '';

    if (choices.length === 0) {
        cardChoicesEl.innerHTML = '<p>No more upgrades available!</p><button id="resumeGameButton">Resume</button>';
        const resumeButton = document.getElementById('resumeGameButton');
        if(resumeButton) {
            resumeButton.onclick = () => {
                hideLevelUpScreen();
                gameState = 'playing';
                playClickSound();
            };
            resumeButton.addEventListener('mouseover', () => { if(!resumeButton.disabled) playSelectSound(); });
        }
    } else {
        choices.forEach(buff => {
            const card = document.createElement('button');
            card.classList.add('card-choice');
            card.dataset.buffId = buff.id;

            let levelText = '';
            if (buff.maxLevel > 1) {
                levelText = ` (Lvl ${buff.currentLevel + 1}/${buff.maxLevel})`;
            }

            card.innerHTML = `
                <div class="card-icon-container">
                    <img src="${buff.icon}" alt="${buff.name}" class="card-icon-svg">
                </div>
                <span class="card-name">${buff.name}${levelText}</span>
                <span class="card-description">${buff.description}</span>
            `;
            card.onclick = () => selectBuff(buff.id);
            card.addEventListener('mouseover', playSelectSound);
            cardChoicesEl.appendChild(card);
        });
    }

    levelUpScreenEl.classList.remove('hidden');
}

function selectBuff(buffId) {
    const selectedBuff = AVAILABLE_BUFFS.find(b => b.id === buffId);
    if (selectedBuff && selectedBuff.currentLevel < selectedBuff.maxLevel) {
        console.log(`Applying buff: ${selectedBuff.name}`);
        selectedBuff.apply(player, weaponStats);
        selectedBuff.currentLevel++;
        activeBuffs.push(selectedBuff);
        playClickSound();
    } else {
        console.warn(`Could not apply buff: ${buffId}`);
    }
    hideLevelUpScreen();
    gameState = 'playing';
    updateUI();
}

function getCurrentAmmoCost() {
    return AMMO_COST_BASE + Math.floor((currentWave -1) * AMMO_COST_SCALE_PER_WAVE);
}

function getCurrentHealthCost() {
     return HEALTH_COST_BASE + Math.floor((currentWave -1) * HEALTH_COST_SCALE_PER_WAVE);
}

function getCurrentUpgradeCost() {
    return UPGRADE_COST_BASE + Math.floor((currentWave -1) * UPGRADE_COST_SCALE_PER_WAVE);
}

function updateUI() {
    if (scoreEl) scoreEl.textContent = score;
    if (waveEl) waveEl.textContent = currentWave;
    if (levelEl) levelEl.textContent = playerLevel;
    if (xpEl) xpEl.textContent = playerExperience;
    if (xpNextEl) xpNextEl.textContent = experienceToNextLevel;
    if (healthEl) healthEl.textContent = player ? Math.max(0, Math.round(player.health)) : 0;
    if (ammoEl) ammoEl.textContent = isReloading ? 'RELOADING' : weaponStats.currentAmmo;
    if (maxAmmoEl) maxAmmoEl.textContent = weaponStats.ammoCapacity;

    const ammoCost = getCurrentAmmoCost();
    const healthCost = getCurrentHealthCost();
    const upgradeCost = getCurrentUpgradeCost();

    if(buyAmmoButton) {
        buyAmmoButton.textContent = `Buy Ammo (${currentWeaponName}) (${ammoCost} Score)`;
        buyAmmoButton.disabled = !player || score < ammoCost || weaponStats.currentAmmo === weaponStats.ammoCapacity || isReloading;
    }
    if(buyHealthButton) {
        buyHealthButton.textContent = `Buy Health (+25 HP) (${healthCost} Score)`;
        buyHealthButton.disabled = !player || score < healthCost || player.health >= player.maxHealth;
    }
    if(upgradeWeaponButton) {
        upgradeWeaponButton.textContent = `Upgrade ${currentWeaponName} (${upgradeCost} Score)`;
        upgradeWeaponButton.disabled = !player || score < upgradeCost;
    }


    if (toggleMusicButton) {
         toggleMusicButton.textContent = isMusicEnabled ? 'ON' : 'OFF';
         toggleMusicButton.className = isMusicEnabled ? 'on' : 'off';
    }
     if (toggleBloodButton) {
         toggleBloodButton.textContent = isBloodEnabled ? 'ON' : 'OFF';
         toggleBloodButton.className = isBloodEnabled ? 'on' : 'off';
     }
     if (toggleShakeButton) {
         toggleShakeButton.textContent = isScreenShakeEnabled ? 'ON' : 'OFF';
         toggleShakeButton.className = isScreenShakeEnabled ? 'on' : 'off';
     }
      if (toggleFullscreenButton) {
         const isCurrentlyFullscreen = document.fullscreenElement != null;
         toggleFullscreenButton.textContent = isCurrentlyFullscreen ? 'ON' : 'OFF';
         toggleFullscreenButton.className = isCurrentlyFullscreen ? 'on' : 'off';
     }
    if (volumeSlider) volumeSlider.value = gameSoundVolume;
    if (volumeValue) volumeValue.textContent = Math.round(gameSoundVolume * 100);
}

function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = zombies.length - 1; j >= 0; j--) {
            if (!bullets[i] || !zombies[j]) continue;
            if (zombies[j].collidesWith(bullets[i])) {
                zombies[j].takeDamage(bullets[i].damage);
                createParticles(bullets[i].x, bullets[i].y, 3, 'blood');
                bullets.splice(i, 1);
                break;
            }
        }
    }
}
function applyScreenShake() {
    if (isScreenShakeEnabled && screenShakeDuration > 0) {
        const currentMagnitude = (typeof screenShakeMagnitude === 'number' ? screenShakeMagnitude : 0) * (screenShakeDuration / 15);
        const shakeX = (Math.random() - 0.5) * 2 * currentMagnitude;
        const shakeY = (Math.random() - 0.5) * 2 * currentMagnitude;
        canvas.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        screenShakeDuration--;
        if (screenShakeDuration <= 0) {
            canvas.style.transform = 'translate(0px, 0px)';
            screenShakeMagnitude = 0;
        }
    } else {
        if (canvas.style.transform !== 'translate(0px, 0px)') {
            canvas.style.transform = 'translate(0px, 0px)';
        }
        screenShakeDuration = 0;
        screenShakeMagnitude = 0;
    }
}
function triggerScreenShake(magnitude, duration) {
    if (!isScreenShakeEnabled) return;
    if (magnitude >= screenShakeMagnitude || duration > screenShakeDuration) {
         screenShakeMagnitude = Math.min(magnitude, MAX_SHAKE_OFFSET);
         screenShakeDuration = duration;
     }
}
function updateGameObjects() { if (player) player.update(); zombies.forEach(zombie => zombie.update()); bullets.forEach(bullet => bullet.update()); particles.forEach(particle => particle.update()); for (let i = bloodDecals.length - 1; i >= 0; i--) { const decal = bloodDecals[i]; decal.lifespan--; if (decal.lifespan <= 0) bloodDecals.splice(i, 1); } checkCollisions(); bullets = bullets.filter(b => b.x > -b.width*2 && b.x < canvas.width + b.width*2 && b.y > -b.height*2 && b.y < canvas.height + b.height*2); particles = particles.filter(p => p.lifespan > 0 && p.size > 0.1); }

function drawDecals() {
    if (!isBloodEnabled) return;
    bloodDecals.forEach(decal => {
        const overallAlpha = decal.maxLifespan > 0 ? Math.max(0, BLOOD_DECAL_MAX_ALPHA * (decal.lifespan / decal.maxLifespan)) : 0;
        if (overallAlpha <= 0) return;

        ctx.save();
        ctx.translate(decal.x, decal.y);
        ctx.rotate(decal.rotation);

        if (decal.splats) {
            decal.splats.forEach(splat => {
                const rgbaMatch = splat.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                if (rgbaMatch) {
                    const r = rgbaMatch[1];
                    const g = rgbaMatch[2];
                    const b = rgbaMatch[3];
                    const baseA = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1.0;
                    const finalAlpha = baseA * overallAlpha;
                    const clampedAlpha = Math.max(0, Math.min(1, finalAlpha));
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
                } else {
                    ctx.fillStyle = `rgba(150, 0, 0, ${overallAlpha})`;
                }
                 ctx.beginPath();
                 ctx.arc(splat.offsetX, splat.offsetY, splat.radius, 0, Math.PI * 2);
                 ctx.fill();
            });
        }
        ctx.restore();
    });
}
function drawGameObjects() { particles.forEach(particle => particle.draw()); if (player) player.draw(); zombies.forEach(zombie => zombie.draw()); bullets.forEach(bullet => bullet.draw()); }


function showShop() { gameState = 'shop'; shopEl.classList.remove('hidden'); updateUI(); } function hideShop() { shopEl.classList.add('hidden'); }
function showLevelUpScreen() { levelUpScreenEl.classList.remove('hidden'); } function hideLevelUpScreen() { levelUpScreenEl.classList.add('hidden'); }
function showWaveMessage(message) { waveMessageEl.textContent = message; waveMessageEl.classList.remove('hidden'); } function hideWaveMessage() { waveMessageEl.classList.add('hidden'); }
function startWaveTransition() { gameState = 'waveTransition'; waveTransitionTimer = WAVE_TRANSITION_DELAY; showWaveMessage(`Wave ${currentWave} Cleared!`); playWaveSound(); if (player) { const healthBonus = 5; const ammoBonusPercent = 0.1; player.health = Math.min(player.maxHealth, player.health + healthBonus); weaponStats.currentAmmo = Math.min(weaponStats.ammoCapacity, weaponStats.currentAmmo + Math.floor(weaponStats.ammoCapacity * ammoBonusPercent)); } updateUI(); }
function handleWaveTransition() { waveTransitionTimer--; if (waveTransitionTimer <= 0) { hideWaveMessage(); showShop(); } }
function gameOver() {
    if (gameState === 'gameOver') return;
    gameState = 'gameOver';
    finalScoreEl.textContent = score;
    gameOverEl.classList.remove('hidden');
    hideLevelUpScreen();
    hideShop();
    triggerScreenShake(15, 45);
    isShooting = false;
    stopMusic();
    if (heartbeatSound && !heartbeatSound.paused) {
        heartbeatSound.pause();
        heartbeatSound.currentTime = 0;
        heartbeatPlaying = false;
    }

    if (player) player.health = 0;
    updateHealthOverlay();
}

function resetGame() {
    console.log("Resetting game...");
    score = 0;
    currentWave = 1;
    playerLevel = 1;
    playerExperience = 0;
    experienceToNextLevel = BASE_XP_TO_LEVEL;
    zombies = [];
    bullets = [];
    particles = [];
    bloodDecals = [];
    activeBuffs = [];
    AVAILABLE_BUFFS.forEach(b => b.currentLevel = 0);

    const playerX = canvas.width / 2 - 8;
    const playerY = canvas.height / 2 - 8;
    if (!player) {
        player = new Player(playerX, playerY);
    } else {
        player.health = PLAYER_HEALTH_START;
        player.maxHealth = PLAYER_HEALTH_START;
        player.speed = PLAYER_SPEED;
        player.x = playerX;
        player.y = playerY;
        player.angle = 0;
        player.healthRegen = 0;
        player.regenTimer = 0;
        player.isMoving = false;
        player.walkFrame = 0;
        player.walkAnimTimer = 0;
    }

    currentWeaponName = STARTING_WEAPON_NAME;
    weaponStats = { ...WEAPONS[currentWeaponName] };
    weaponStats.currentAmmo = weaponStats.ammoCapacity;
    bulletImg.src = weaponStats.bulletImgSrc;
    isShooting = false;
    isReloading = false;
    shootCooldown = 0;
    reloadTimer = 0;
    keys = {};
    screenShakeDuration = 0;
    screenShakeMagnitude = 0;
    musicStarted = false;
    healthPulseTimer = 0;


    stopMusic();
    if (heartbeatSound && !heartbeatSound.paused) {
        heartbeatSound.pause();
        heartbeatSound.currentTime = 0;
        heartbeatPlaying = false;
    }
    updateHealthOverlay();


    updateUI();
    gameOverEl.classList.add('hidden');
    hideShop();
    hideWaveMessage();
    hideLevelUpScreen();


    gameState = 'playing';
    startWave(currentWave);
    setTimeout(updateMusicState, 50);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    applyScreenShake();


    if (gameState === 'playing' || gameState === 'waveTransition' || gameState === 'shop' || gameState === 'levelUp') {
        healthPulseTimer += HEALTH_PULSE_FREQUENCY;
    }

    if (gameState === 'menu' || gameState === 'settings') {

    } else if (gameState === 'playing' || gameState === 'waveTransition' || gameState === 'shop' || gameState === 'levelUp' || gameState === 'gameOver') {
         if (gameState === 'playing' || gameState === 'waveTransition') {
             updateGameObjects();
         }
         if (gameState === 'waveTransition') {
            handleWaveTransition();
         }


         if (gameState === 'playing' || gameState === 'waveTransition' || gameState === 'shop' || gameState === 'levelUp') {
            updateHeartbeatSound();
            updateHealthOverlay();
         } else if (gameState === 'gameOver') {

             updateHealthOverlay();
         }

         drawDecals();
         drawGameObjects();


         if (gameState === 'levelUp') {
             ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
             ctx.fillRect(0, 0, canvas.width, canvas.height);
         }

    } else if (gameState === 'loading') {
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; ctx.font = "20px 'Press Start 2P'"; ctx.textAlign = "center"; ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);
    }


    requestAnimationFrame(gameLoop);
}

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; if (player) { if (gameState !== 'playing' && gameState !== 'levelUp') { player.x = canvas.width / 2 - player.width / 2; player.y = canvas.height / 2 - player.height / 2; } else { player.x = Math.max(0, Math.min(canvas.width - player.width, player.x)); player.y = Math.max(0, Math.min(canvas.height - player.height, player.y)); } } updateUI(); }

function handleFirstInteraction() {
    console.log("User interaction.");
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log("AudioContext resumed by user interaction.");
            updateMusicState();

            if (heartbeatSound) {
                heartbeatSound.play().then(() => {
                     heartbeatSound.pause();
                     console.log("Heartbeat primed.");
                }).catch(e => console.warn("Heartbeat prime failed", e));
            }
        }).catch(e => console.error("Resume failed:", e));
    } else {
         updateMusicState();
          if (heartbeatSound) {
                heartbeatSound.play().then(() => {
                     heartbeatSound.pause();
                     console.log("Heartbeat primed.");
                }).catch(e => console.warn("Heartbeat prime failed", e));
            }
    }
    window.removeEventListener('click', handleFirstInteraction);
    window.removeEventListener('keydown', handleFirstInteraction);
}
window.addEventListener('click', handleFirstInteraction); window.addEventListener('keydown', handleFirstInteraction); window.addEventListener('resize', resizeCanvas); document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; if (keys['r'] && !isReloading && gameState === 'playing') startReload(); }); document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; }); window.addEventListener('mousemove', (e) => { if (gameState !== 'levelUp') { const rect = canvas.getBoundingClientRect(); mousePos.x = e.clientX - rect.left; mousePos.y = e.clientY - rect.top; } }); window.addEventListener('mousedown', (e) => { const rect = canvas.getBoundingClientRect(); const clickX = e.clientX - rect.left; const clickY = e.clientY - rect.top; const isInsideCanvas = clickX >= 0 && clickX <= canvas.width && clickY >= 0 && clickY <= canvas.height; if (e.button === 0 && gameState === 'playing' && isInsideCanvas) isShooting = true; if (!musicStarted && gameState !== 'menu' && gameState !== 'settings') handleFirstInteraction(); }); window.addEventListener('mouseup', (e) => { if (e.button === 0) isShooting = false; }); canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
    }
    updateUI();
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari & Opera */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
    }
     updateUI();
}

function saveSettings() {
    localStorage.setItem('isMusicEnabled', isMusicEnabled);
    localStorage.setItem('isBloodEnabled', isBloodEnabled);
    localStorage.setItem('isScreenShakeEnabled', isScreenShakeEnabled);
    localStorage.setItem('gameSoundVolume', gameSoundVolume);
}

function loadSettings() {
    isMusicEnabled = localStorage.getItem('isMusicEnabled') !== 'false';
    isBloodEnabled = localStorage.getItem('isBloodEnabled') !== 'false';
    isScreenShakeEnabled = localStorage.getItem('isScreenShakeEnabled') !== 'false';
    const savedVolume = localStorage.getItem('gameSoundVolume');
    gameSoundVolume = savedVolume !== null ? parseFloat(savedVolume) : 0.6;

    console.log("Loaded settings:", { isMusicEnabled, isBloodEnabled, isScreenShakeEnabled, gameSoundVolume });
    setGameSoundVolume(gameSoundVolume);
    updateUI();
}


startGameButton.addEventListener('click', () => {
    playClickSound();
    mainMenuEl.classList.add('hidden');
    canvas.classList.remove('hidden');
    uiElement.classList.remove('hidden');
    resetGame();
});

settingsButton.addEventListener('click', () => {
    playClickSound();
    gameState = 'settings';
    mainMenuEl.classList.add('hidden');
    settingsMenuEl.classList.remove('hidden');
    updateUI();
});

backButton.addEventListener('click', () => {
    playClickSound();
    gameState = 'menu';
    settingsMenuEl.classList.add('hidden');
    mainMenuEl.classList.remove('hidden');
    saveSettings();
});

toggleMusicButton.addEventListener('click', () => {
    isMusicEnabled = !isMusicEnabled;
    updateMusicState();
    updateUI();
    playClickSound();
});

toggleBloodButton.addEventListener('click', () => {
    isBloodEnabled = !isBloodEnabled;
    if (!isBloodEnabled) {
        particles = particles.filter(p => p.type !== 'blood' && p.type !== 'zombieDeath');
        bloodDecals = [];
    }
    updateUI();
    playClickSound();
});

toggleShakeButton.addEventListener('click', () => {
    isScreenShakeEnabled = !isScreenShakeEnabled;
    if (!isScreenShakeEnabled) {
         screenShakeDuration = 0;
         applyScreenShake();
    }
    updateUI();
    playClickSound();
});

toggleFullscreenButton.addEventListener('click', () => {
    playClickSound();
    if (document.fullscreenElement) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
});


document.addEventListener('fullscreenchange', () => updateUI());
document.addEventListener('webkitfullscreenchange', () => updateUI());
document.addEventListener('mozfullscreenchange', () => updateUI());
document.addEventListener('MSFullscreenChange', () => updateUI());


volumeSlider.addEventListener('input', (e) => {
    setGameSoundVolume(e.target.value);
});

volumeSlider.addEventListener('change', () => {

});


restartButton.addEventListener('click', () => {
    playClickSound();
    mainMenuEl.classList.remove('hidden');
    gameOverEl.classList.add('hidden');
    canvas.classList.add('hidden');
    uiElement.classList.add('hidden');
    gameState = 'menu';
    stopMusic();
     if (heartbeatSound && !heartbeatSound.paused) {
        heartbeatSound.pause();
        heartbeatSound.currentTime = 0;
        heartbeatPlaying = false;
    }
    updateHealthOverlay();
});

buyAmmoButton.addEventListener('click', () => {
    playClickSound();
    const cost = getCurrentAmmoCost();
    if (score >= cost && weaponStats.currentAmmo < weaponStats.ammoCapacity) {
        score -= cost;
        weaponStats.currentAmmo = weaponStats.ammoCapacity;
        isReloading = false;
        reloadTimer = 0;
        updateUI();
    }
});

buyHealthButton.addEventListener('click', () => {
    playClickSound();
    const cost = getCurrentHealthCost();
    const healAmount = 25;
    if (player && score >= cost && player.health < player.maxHealth) {
        score -= cost;
        player.health = Math.min(player.maxHealth, player.health + healAmount);
        updateUI();
    }
});

upgradeWeaponButton.addEventListener('click', () => {
    playClickSound();
    const cost = getCurrentUpgradeCost();
    if (score >= cost) {
        score -= cost;
        weaponStats.damage = Math.round(weaponStats.damage * 1.15); // Keep upgrade effect the same
        weaponStats.reloadTime = Math.max(20, Math.floor(weaponStats.reloadTime * 0.9));
        console.log(`Upgraded! Dmg: ${weaponStats.damage}, Rld: ${weaponStats.reloadTime}f`);
        updateUI();
    }
});

nextWaveButton.addEventListener('click', () => {
    playClickSound();
    startWave(currentWave + 1);
});


startGameButton.addEventListener('mouseover', () => { if(!startGameButton.disabled) playSelectSound(); });
settingsButton.addEventListener('mouseover', () => { if(!settingsButton.disabled) playSelectSound(); });
backButton.addEventListener('mouseover', () => { if(!backButton.disabled) playSelectSound(); });
toggleMusicButton.addEventListener('mouseover', () => { if(!toggleMusicButton.disabled) playSelectSound(); });
toggleBloodButton.addEventListener('mouseover', () => { if(!toggleBloodButton.disabled) playSelectSound(); });
toggleShakeButton.addEventListener('mouseover', () => { if(!toggleShakeButton.disabled) playSelectSound(); });
toggleFullscreenButton.addEventListener('mouseover', () => { if(!toggleFullscreenButton.disabled) playSelectSound(); });
restartButton.addEventListener('mouseover', () => { if(!restartButton.disabled) playSelectSound(); });
buyAmmoButton.addEventListener('mouseover', () => { if(!buyAmmoButton.disabled) playSelectSound(); });
buyHealthButton.addEventListener('mouseover', () => { if(!buyHealthButton.disabled) playSelectSound(); });
upgradeWeaponButton.addEventListener('mouseover', () => { if(!upgradeWeaponButton.disabled) playSelectSound(); });
nextWaveButton.addEventListener('mouseover', () => { if(!nextWaveButton.disabled) playSelectSound(); });


function initializeGame() {
    console.log("Initializing game...");
    if (!uiElement || !scoreEl || !waveEl || !healthEl || !ammoEl || !maxAmmoEl || !levelEl || !xpEl || !xpNextEl || !mainMenuEl || !startGameButton || !settingsMenuEl || !settingsButton || !healthOverlayEl) {
         console.error("One or more essential UI elements (including menu/settings/overlay) are missing. Check console.");
         document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top: 50px;'>Error: Missing UI elements in HTML. Check console.</h1>";
         return;
    }
    if (!levelUpScreenEl || !cardChoicesEl) {
        console.error("Level Up UI elements (#levelUpScreen, #cardChoices) missing. Leveling will not work.");
    }
    loadAudio();
    loadSettings();
    resizeCanvas();

    gameState = 'menu';
    mainMenuEl.classList.remove('hidden');
    canvas.classList.add('hidden');
    uiElement.classList.add('hidden');
    settingsMenuEl.classList.add('hidden');
    gameLoop();
}
initializeGame();
