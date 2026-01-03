console.clear();

const candleFlameFrag = document.querySelector("#candleflame-frag").textContent;
const burnFrag = document.querySelector("#burn-frag").textContent;

// Candle flame parameters
const flameParams = {
    cameraY: 2.5,   // 傾斜
    lookAtY: 1.5,   // 縦位置
    swaySpeed: 3.0  // 揺れ速度
};

// Burn effect parameters
const burnParams = {
    burnSpeed: 3.0,  // seconds
    burnEdgeIntensity: 1.5,
    burnEdgeWidth: 0.05,
    burnNoiseScale: 0.25,
    innerColorR: 8.0,
    innerColorG: 3.2,
    innerColorB: 0.0,
    outerColorR: 1.0,
    outerColorG: 0.1,
    outerColorB: 0.0,
    charColorR: 0.0,
    charColorG: 0.0,
    charColorB: 0.0
};

//
// BURN FILTER
// ===========================================================================
class BurnFilter extends PIXI.Filter {

    constructor(paperTexture) {
        console.log('BurnFilter constructor called');
        console.log('burnFrag exists:', typeof burnFrag !== 'undefined');
        console.log('paperTexture:', paperTexture);

        try {
            super(null, burnFrag);
            console.log('PIXI.Filter super() succeeded');
        } catch (error) {
            console.error('PIXI.Filter super() failed:', error);
            throw error;
        }

        this.uniforms.dimensions = new Float32Array(2);
        this.uniforms.paperTexture = paperTexture;
        this.uniforms.burnProgress = 0.0;
        this.uniforms.noiseSeed = Math.random();
        this.uniforms.burnNoiseScale = burnParams.burnNoiseScale;
        this.uniforms.burnEdgeWidth1 = burnParams.burnEdgeWidth;
        this.uniforms.burnEdgeWidth2 = burnParams.burnEdgeWidth * 5.0;
        this.uniforms.innerColor = new Float32Array([
            burnParams.innerColorR,
            burnParams.innerColorG,
            burnParams.innerColorB
        ]);
        this.uniforms.outerColor = new Float32Array([
            burnParams.outerColorR,
            burnParams.outerColorG,
            burnParams.outerColorB
        ]);
        this.uniforms.charColor = new Float32Array([
            burnParams.charColorR,
            burnParams.charColorG,
            burnParams.charColorB
        ]);
        this.uniforms.colorNoise = 500.0;

        this.padding = 0;

        console.log('BurnFilter uniforms set:', this.uniforms);
    }

    apply(filterManager, input, output, clear) {
        if (!this._logged) {
            console.log('BurnFilter apply - input.sourceFrame:', input.sourceFrame.width, input.sourceFrame.height);
            console.log('BurnFilter apply - input.size:', input.size.width, input.size.height);
            this._logged = true;
        }

        this.uniforms.dimensions[0] = input.size.width;
        this.uniforms.dimensions[1] = input.size.height;

        // Update parameters every frame
        this.uniforms.burnNoiseScale = burnParams.burnNoiseScale;
        this.uniforms.burnEdgeWidth1 = burnParams.burnEdgeWidth;
        this.uniforms.burnEdgeWidth2 = burnParams.burnEdgeWidth * 5.0;
        this.uniforms.innerColor[0] = burnParams.innerColorR * burnParams.burnEdgeIntensity;
        this.uniforms.innerColor[1] = burnParams.innerColorG * burnParams.burnEdgeIntensity;
        this.uniforms.innerColor[2] = burnParams.innerColorB * burnParams.burnEdgeIntensity;
        this.uniforms.outerColor[0] = burnParams.outerColorR * burnParams.burnEdgeIntensity;
        this.uniforms.outerColor[1] = burnParams.outerColorG * burnParams.burnEdgeIntensity;
        this.uniforms.outerColor[2] = burnParams.outerColorB * burnParams.burnEdgeIntensity;
        this.uniforms.charColor[0] = burnParams.charColorR;
        this.uniforms.charColor[1] = burnParams.charColorG;
        this.uniforms.charColor[2] = burnParams.charColorB;

        filterManager.applyFilter(this, input, output, clear);
    }
}

//
// CANDLE FLAME FILTER (3D Raymarching)
// ===========================================================================
class CandleFlameFilter extends PIXI.Filter {

    constructor() {
        super(null, candleFlameFrag);

        this.uniforms.dimensions = new Float32Array(2);
        this.uniforms.time = 0.0;
        this.uniforms.cameraY = flameParams.cameraY;
        this.uniforms.lookAtY = flameParams.lookAtY;
        this.uniforms.swaySpeed = flameParams.swaySpeed;
        this.time = 0.0;
    }

    apply(filterManager, input, output, clear) {
        this.uniforms.dimensions[0] = input.sourceFrame.width;
        this.uniforms.dimensions[1] = input.sourceFrame.height;
        this.uniforms.time = this.time;
        this.uniforms.cameraY = flameParams.cameraY;
        this.uniforms.lookAtY = flameParams.lookAtY;
        this.uniforms.swaySpeed = flameParams.swaySpeed;

        filterManager.applyFilter(this, input, output, clear);
    }
}


//
// APPLICATION
// ===========================================================================
class Application extends PIXI.Application {

    constructor() {

        if (window.devicePixelRatio > 1) {
            PIXI.settings.RESOLUTION = 2;
        }

        PIXI.settings.PRECISION_FRAGMENT = "highp";

        super({
            view: document.querySelector("#view"),
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x000000,
            autoResize: true
        });

        this.isResized = true;
        this.init();
    }

    init() {
        // 3D ロウソク+炎フィルターを作成
        this.flame = new CandleFlameFilter();

        // 炎用コンテナを作成
        flameContainer = new PIXI.Container();
        flameContainer.filterArea = this.screen;
        flameContainer.filters = [this.flame];
        this.stage.addChild(flameContainer);

        this.ticker.add(this.update, this);
        window.addEventListener("resize", () => this.isResized = true);
    }

    update(delta) {

        if (this.isResized) {
            this.renderer.resize(window.innerWidth, window.innerHeight);
            this.isResized = false;
        }

        this.flame.time += 0.1 * delta;
    }
}

let app; // グローバル変数として宣言
let flameContainer; // 炎用コンテナ
app = new Application();

// GUI initialization
const gui = new dat.GUI();

// Burn effect controls
const burnFolder = gui.addFolder('燃焼エフェクト');
const burnBasicFolder = burnFolder.addFolder('基本設定');
burnBasicFolder.add(burnParams, 'burnSpeed', 1.0, 10.0).name('燃焼速度（秒）');
burnBasicFolder.add(burnParams, 'burnNoiseScale', 0.1, 0.5).name('ノイズの細かさ');
burnBasicFolder.open();

burnFolder.open();

// Flame sway controls
const flameFolder = gui.addFolder('炎の設定');
flameFolder.add(flameParams, 'swaySpeed', 0.1, 10.0).name('揺れ速度');
flameFolder.open();

//
// UI STATE MANAGEMENT
// ===========================================================================
let currentState = 'top'; // 'top' | 'input' | 'burning'

// 炎の位置を一元管理
const flamePosition = {
    x: window.innerWidth / 2,  // 画面中央
    y: window.innerHeight * 0.4  // 画面上寄り（40%の位置）
};

function switchScreen(newState) {
    console.log('Switching to state:', newState);

    // すべてのスクリーンから active クラスを削除
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // 新しいスクリーンに active クラスを追加
    const screenMap = {
        'top': 'screen-top',
        'input': 'screen-input',
        'burning': 'screen-burning'
    };

    const targetScreen = document.getElementById(screenMap[newState]);
    if (targetScreen) {
        targetScreen.classList.add('active');
        console.log('Activated screen:', screenMap[newState]);
    } else {
        console.error('Screen not found:', screenMap[newState]);
    }

    currentState = newState;
}

// ランダムに紙のテクスチャを選択
function selectRandomPaperTexture() {
    const paperCount = 4; // paper1.jpg ~ paper4.jpg
    const randomIndex = Math.floor(Math.random() * paperCount) + 1;
    const paperElement = document.querySelector('.paper');

    console.log('Selecting random paper texture:', randomIndex);

    if (paperElement) {
        paperElement.style.backgroundImage = `url('textures/paper${randomIndex}.jpg')`;
        console.log('Paper texture applied:', `textures/paper${randomIndex}.jpg`);
    } else {
        console.error('.paper element not found');
    }
}

// 燃焼アニメーション開始
async function startBurnAnimation() {
    const paperContainer = document.getElementById('paper-container');
    const paper = document.querySelector('.paper');

    if (!paperContainer || !paper) {
        console.error('Paper elements not found');
        return;
    }

    // 紙の現在位置とサイズを取得
    const rect = paperContainer.getBoundingClientRect();
    const paperCenterX = rect.left + rect.width / 2;
    const paperCenterY = rect.top + rect.height / 2;

    // 炎の位置との差分を計算
    const deltaX = flamePosition.x - paperCenterX;
    const deltaY = flamePosition.y - paperCenterY;

    // 紙をクローン
    const clone = paper.cloneNode(true);
    clone.id = 'paper-animation-clone';

    // textareaをdivに置き換え
    const textarea = clone.querySelector('#text-input');
    if (textarea) {
        const text = textarea.value;
        textarea.parentNode.removeChild(textarea);

        // 測定用の一時div（見えない場所で計算）
        const measureDiv = document.createElement('div');
        measureDiv.style.cssText = `
            position: absolute;
            visibility: hidden;
            width: ${rect.width * 0.9}px;
            height: ${rect.height * 0.9}px;
            font-size: 48px;
            font-family: 'Yu Mincho', 'YuMincho', 'Hiragino Mincho Pro', serif;
            line-height: 1.8;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow: hidden;
        `;
        measureDiv.textContent = text;
        document.body.appendChild(measureDiv);

        // フォントサイズを計算
        let fontSize = 48;
        const minFontSize = 3;
        while (measureDiv.scrollHeight > measureDiv.clientHeight && fontSize > minFontSize) {
            fontSize -= 1;
            measureDiv.style.fontSize = fontSize + 'px';
        }
        console.log('Calculated font size:', fontSize);

        // 3pxでも収まらない場合は省略記号を追加
        const isOverflow = measureDiv.scrollHeight > measureDiv.clientHeight;

        // 測定用divを削除
        document.body.removeChild(measureDiv);

        // 本番用のtextDivを作成（height: auto）
        const textDiv = document.createElement('div');
        textDiv.textContent = text;
        textDiv.style.cssText = `
            width: 100%;
            font-size: ${fontSize}px;
            font-family: 'Yu Mincho', 'YuMincho', 'Hiragino Mincho Pro', serif;
            color: #000;
            line-height: 1.8;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: ${isOverflow ? Math.floor((rect.height * 0.9) / (fontSize * 1.8)) : 'none'};
        `;
        clone.appendChild(textDiv);
    }

    // クローンのスタイル（上詰め・左詰め）
    clone.style.position = 'fixed';
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.zIndex = '200';
    clone.style.transition = 'none';  // 明示的に transition を無効化
    clone.style.display = 'flex';
    clone.style.flexDirection = 'column';
    clone.style.setProperty('align-items', 'flex-start', 'important');
    clone.style.setProperty('justify-content', 'flex-start', 'important');
    const computedPadding = getComputedStyle(paper).padding;
    clone.style.padding = computedPadding;
    clone.style.boxSizing = 'border-box';
    clone.style.overflow = 'hidden';

    // bodyに追加
    document.body.appendChild(clone);

    // 1. requestAnimationFrame で1フレーム待ってからキャプチャ
    await new Promise(resolve => requestAnimationFrame(resolve));

    console.log('Starting html2canvas capture (before animation)...');
    const canvas = await html2canvas(clone, {
        backgroundColor: null,
        logging: false,
        scale: window.devicePixelRatio,  // 高DPIデバイスで高解像度キャプチャ
        width: rect.width,
        height: rect.height
    }).then(canvas => {
        console.log('html2canvas completed (before animation)');
        console.log('Canvas size:', canvas.width, 'x', canvas.height);
        return canvas;
    }).catch(error => {
        console.error('html2canvas error:', error);
        throw error;
    });

    // 2. キャプチャ完了後に元の画面を非表示
    switchScreen('burning');

    // 3. 紙移動アニメーション開始
    clone.style.transition = 'transform 2.5s ease-in-out';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.9)`;
        });
    });

    // 4. 移動完了を待つ
    await new Promise(resolve => setTimeout(resolve, 2500));
    console.log('Paper movement animation completed');

    // 5. クローンを削除
    if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
        console.log('Clone removed');
    }

    // 6. PixiJS で燃焼シェーダーを開始（小さくなったサイズで）
    // 移動後のサイズと位置を計算
    const finalScale = 0.9;
    const finalWidth = rect.width * finalScale;
    const finalHeight = rect.height * finalScale;

    // 紙の移動後の中心位置
    const finalX = paperCenterX + deltaX;
    const finalY = paperCenterY + deltaY;

    console.log('Calling startBurnShader with size:', finalWidth, 'x', finalHeight);
    console.log('Calling startBurnShader with position:', finalX, 'x', finalY);
    startBurnShader(canvas, finalWidth, finalHeight, finalX, finalY);
}

// プレビュー燃焼エフェクト（開発/テスト用）
function previewBurnEffect() {
    // ダミーの紙を作成
    const dummyCanvas = document.createElement('canvas');
    dummyCanvas.width = 800;
    dummyCanvas.height = 480;
    const ctx = dummyCanvas.getContext('2d');

    // 紙のテクスチャ（白背景）
    ctx.fillStyle = '#f5f1e8';
    ctx.fillRect(0, 0, 800, 480);

    // ダミーテキスト
    ctx.fillStyle = '#000';
    ctx.font = '48px "Yu Mincho", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines = [
        '燃焼エフェクトの',
        'プレビューです',
        '',
        'パラメータを調整して',
        '燃え方を確認できます'
    ];
    lines.forEach((line, i) => {
        ctx.fillText(line, 40, 40 + i * 70);
    });

    // 燃焼シェーダー開始
    startBurnShader(dummyCanvas, 800, 480);
}

// 燃焼シェーダーアニメーション
function startBurnShader(canvas, displayWidth, displayHeight, posX, posY) {
    console.log('startBurnShader:', canvas.width, 'x', canvas.height, '→', displayWidth, 'x', displayHeight, 'at', posX, posY);

    try {
        // Canvas から PixiJS テクスチャを作成
        const baseTexture = new PIXI.BaseTexture(canvas);
        baseTexture.resolution = PIXI.settings.RESOLUTION || 1;
        baseTexture.update();
        const paperTexture = new PIXI.Texture(baseTexture);

        // Sprite を作成
        const sprite = new PIXI.Sprite(paperTexture);

        // 表示サイズを明示的に設定
        sprite.width = displayWidth;
        sprite.height = displayHeight;

        // 位置を設定（渡された位置、またはデフォルト）
        sprite.x = posX !== undefined ? posX : window.innerWidth / 2;
        sprite.y = posY !== undefined ? posY : window.innerHeight * 0.4;
        sprite.anchor.set(0.5);

        // BurnFilter を適用
        const burnFilter = new BurnFilter(paperTexture);
        sprite.filters = [burnFilter];

        // Stage に追加
        app.stage.addChild(sprite);

        // burnProgress を 0 → 1 にアニメーション
        const duration = burnParams.burnSpeed * 1000; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1.0);

            burnFilter.uniforms.burnProgress = progress;

            if (progress < 1.0) {
                requestAnimationFrame(animate);
            } else {
                // 燃焼完了
                console.log('Burn animation completed');
                app.stage.removeChild(sprite);
                sprite.destroy();
                paperTexture.destroy(true);  // baseTexture も一緒に破棄

                // テキストエリアをクリア
                const textInput = document.getElementById('text-input');
                if (textInput) {
                    textInput.value = '';
                }
                switchScreen('top');
            }
        };

        animate();
    } catch (error) {
        console.error('Error in startBurnShader:', error);
    }
}

// TornPaper初期化
function initTornPaper() {
    if (typeof Tornpaper === 'undefined') {
        console.error('Tornpaper library not loaded');
        return;
    }

    // 既存のTornPaper SVGフィルターを削除
    const existingFilter = document.getElementById('filter_tornpaper');
    if (existingFilter) {
        existingFilter.parentElement.remove();  // SVG要素ごと削除
    }

    new Tornpaper({
        seed: Math.random() * 10000,
        tornFrequency: 0.05,
        tornScale: 10,
        grungeFrequency: 0,  // grungeを無効化
        grungeScale: 0
    });

    console.log('TornPaper initialized');
}

// ウィンドウリサイズ時に炎の位置を更新
function updateFlamePosition() {
    flamePosition.x = window.innerWidth / 2;
    flamePosition.y = window.innerHeight * 0.4;
}

// 確認ダイアログ表示
function showConfirmDialog() {
    const dialog = document.getElementById('confirm-dialog');
    if (dialog) {
        dialog.classList.add('active');
    }
}

// 確認ダイアログ非表示
function hideConfirmDialog() {
    const dialog = document.getElementById('confirm-dialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

// ページ読み込み完了後に初期化
window.addEventListener('load', () => {
    console.log('Page loaded, initializing...');
    console.log('Tornpaper library loaded:', typeof Tornpaper !== 'undefined');

    selectRandomPaperTexture(); // ランダムにテクスチャを選択
    updateFlamePosition(); // 炎の位置を初期化

    // イベントリスナー設定
    const btnWrite = document.getElementById('btn-write');
    const btnBurn = document.getElementById('btn-burn');
    const screenInput = document.getElementById('screen-input');
    const paperContainer = document.getElementById('paper-container');
    const textInput = document.getElementById('text-input');
    const btnConfirmYes = document.getElementById('btn-confirm-yes');
    const btnConfirmNo = document.getElementById('btn-confirm-no');

    if (btnWrite) {
        btnWrite.addEventListener('click', () => {
            console.log('Write button clicked');
            selectRandomPaperTexture(); // 毎回新しいランダムテクスチャを選択
            switchScreen('input');

            // 一時的に無効化: TornPaper
            // requestAnimationFrame(() => {
            //     requestAnimationFrame(() => {
            //         initTornPaper();
            //     });
            // });
        });
    } else {
        console.error('btn-write not found');
    }

    if (btnBurn) {
        btnBurn.addEventListener('click', () => {
            console.log('Burn button clicked');
            startBurnAnimation();
        });
    } else {
        console.error('btn-burn not found');
    }

    // 紙の外側をタップした時の処理
    if (screenInput) {
        screenInput.addEventListener('click', (e) => {
            console.log('Screen input clicked, currentState:', currentState);
            console.log('Target:', e.target);
            console.log('PaperContainer contains target:', paperContainer ? paperContainer.contains(e.target) : 'no container');

            // 入力画面が表示されている時のみ
            if (currentState !== 'input') return;

            // 「燃やす」ボタンをクリックした場合は無視
            const btnBurn = document.getElementById('btn-burn');
            if (btnBurn && (e.target === btnBurn || btnBurn.contains(e.target))) {
                console.log('Burn button clicked, ignoring');
                return;
            }

            // 紙の範囲外をクリックした場合
            if (paperContainer && !paperContainer.contains(e.target)) {
                console.log('Clicked outside paper');
                const inputValue = textInput ? textInput.value : '';
                console.log('Input value length:', inputValue.length);

                if (inputValue.length === 0) {
                    // 未入力なら即座にTOP画面に戻る
                    console.log('Empty input, returning to top');
                    switchScreen('top');
                } else {
                    // 入力済みなら確認ダイアログを表示
                    console.log('Has input, showing dialog');
                    showConfirmDialog();
                }
            } else {
                console.log('Clicked inside paper');
            }
        });
    }

    // 確認ダイアログの「はい」ボタン
    if (btnConfirmYes) {
        btnConfirmYes.addEventListener('click', () => {
            hideConfirmDialog();
            // テキストエリアをクリア
            if (textInput) {
                textInput.value = '';
            }
            switchScreen('top');
        });
    }

    // 確認ダイアログの「いいえ」ボタン
    if (btnConfirmNo) {
        btnConfirmNo.addEventListener('click', () => {
            hideConfirmDialog();
            // 入力画面のまま継続
        });
    }
});

// ウィンドウリサイズ時に炎の位置を更新
window.addEventListener('resize', () => {
    updateFlamePosition();
});
