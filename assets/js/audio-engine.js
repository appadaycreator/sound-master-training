 /**
 * サウンドマスター - 音声生成エンジン
 * Web Audio APIを使用して音声を生成・再生する機能を提供します
 */

class AudioEngine {
    constructor() {
        // Web Audio APIの初期化
        this.initialized = false;
        this.audioContext = null;
        this.masterGainNode = null;
        
        // 音程・和音の定義
        this.noteFrequencies = {
            'C': 261.63, // ド
            'C#': 277.18, // ド#
            'D': 293.66, // レ
            'D#': 311.13, // レ#
            'E': 329.63, // ミ
            'F': 349.23, // ファ
            'F#': 369.99, // ファ#
            'G': 392.00, // ソ
            'G#': 415.30, // ソ#
            'A': 440.00, // ラ
            'A#': 466.16, // ラ#
            'B': 493.88  // シ
        };
        
        // 音程の定義
        this.intervals = {
            '1': 0, // 完全一度（同じ音）
            '2m': 1, // 短2度
            '2M': 2, // 長2度
            '3m': 3, // 短3度
            '3M': 4, // 長3度
            '4': 5, // 完全4度
            '5': 7, // 完全5度
            '6m': 8, // 短6度
            '6M': 9, // 長6度
            '7m': 10, // 短7度
            '7M': 11, // 長7度
            '8': 12  // オクターブ
        };
        
        // 和音の定義
        this.chords = {
            'maj': [0, 4, 7],     // メジャーコード（長三和音）
            'min': [0, 3, 7],     // マイナーコード（短三和音）
            'dim': [0, 3, 6],     // ディミニッシュコード（減三和音）
            'aug': [0, 4, 8],     // オーグメントコード（増三和音）
            'sus4': [0, 5, 7],    // サスフォーコード
            'sus2': [0, 2, 7],    // サスツーコード
            '7': [0, 4, 7, 10],   // 7thコード（属七和音）
            'maj7': [0, 4, 7, 11] // maj7コード（長七和音）
        };
        
        // ボリューム設定
        this.volume = 0.7;
        
        // 再生中のオシレーターを追跡
        this.activeOscillators = [];
        
        // イニシャライズ時のエラーログ用変数
        this.initError = null;
        
        console.log('AudioEngine: インスタンスを作成しました');
    }
    
    /**
     * 音声エンジンの初期化
     * ユーザーアクションから呼び出す必要がある
     */
    async initialize() {
        try {
            if (this.initialized) {
                console.log('AudioEngine: すでに初期化されています');
                return true;
            }
            
            console.log('AudioEngine: 初期化を開始します');
            
            // AudioContextの作成
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                throw new Error('Web Audio APIがサポートされていません');
            }
            
            this.audioContext = new AudioContext();
            
            // マスターボリュームの設定
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.volume;
            this.masterGainNode.connect(this.audioContext.destination);
            
            this.initialized = true;
            console.log('AudioEngine: 初期化が完了しました');
            return true;
        } catch (error) {
            console.error('AudioEngine: 初期化に失敗しました', error);
            this.initError = error;
            return false;
        }
    }
    
    /**
     * 初期化状態の確認と必要に応じた初期化の実行
     */
    async ensureInitialized() {
        if (!this.initialized) {
            const success = await this.initialize();
            if (!success) {
                throw new Error('音声エンジンの初期化に失敗しました: ' + (this.initError?.message || '不明なエラー'));
            }
        }
        
        // AudioContextが停止している場合は再開
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    /**
     * 単音を再生
     * @param {string} note - 音階の名前（例: 'C', 'D#'）
     * @param {number} octave - オクターブ（デフォルト: 4）
     * @param {number} duration - 再生時間（秒）（デフォルト: 1.0）
     * @returns {Promise} 音の再生完了を表すPromise
     */
    async playNote(note, octave = 4, duration = 1.0) {
        await this.ensureInitialized();
        
        const freq = this.getNoteFrequency(note, octave);
        console.log(`AudioEngine: 単音を再生します - ${note}${octave} (${freq}Hz)`);
        
        return this.playSingleFrequency(freq, duration);
    }
    
    /**
     * 音程（2つの音）を再生
     * @param {string} baseNote - 基準となる音階（例: 'C'）
     * @param {string} intervalType - 音程の種類（例: '3M'）
     * @param {number} octave - 基準音のオクターブ（デフォルト: 4）
     * @param {number} duration - 再生時間（秒）（デフォルト: 1.0）
     * @param {boolean} isSequential - 順番に再生するかどうか（デフォルト: false）
     * @returns {Promise} 音の再生完了を表すPromise
     */
    async playInterval(baseNote, intervalType, octave = 4, duration = 1.0, isSequential = false) {
        await this.ensureInitialized();
        
        // 基準音の周波数を計算
        const baseFreq = this.getNoteFrequency(baseNote, octave);
        
        // 音程から2つ目の音の周波数を計算
        const semitones = this.intervals[intervalType];
        if (semitones === undefined) {
            throw new Error(`無効な音程です: ${intervalType}`);
        }
        
        const secondFreq = baseFreq * Math.pow(2, semitones / 12);
        
        console.log(`AudioEngine: 音程を再生します - ${baseNote}${octave} と 音程${intervalType} (${baseFreq}Hz, ${secondFreq}Hz)`);
        
        if (isSequential) {
            // 順番に再生
            await this.playSingleFrequency(baseFreq, duration);
            return this.playSingleFrequency(secondFreq, duration);
        } else {
            // 同時に再生
            return this.playMultipleFrequencies([baseFreq, secondFreq], duration);
        }
    }
    
    /**
     * 和音を再生
     * @param {string} rootNote - ルート音の音階（例: 'C'）
     * @param {string} chordType - 和音の種類（例: 'maj', 'min'）
     * @param {number} octave - ルート音のオクターブ（デフォルト: 4）
     * @param {number} duration - 再生時間（秒）（デフォルト: 1.0）
     * @param {boolean} isArpeggio - アルペジオ形式で再生するかどうか（デフォルト: false）
     * @returns {Promise} 音の再生完了を表すPromise
     */
    async playChord(rootNote, chordType, octave = 4, duration = 1.0, isArpeggio = false) {
        await this.ensureInitialized();
        
        // 和音の構成を取得
        const chordStructure = this.chords[chordType];
        if (!chordStructure) {
            throw new Error(`無効な和音タイプです: ${chordType}`);
        }
        
        // ルート音の周波数を計算
        const rootFreq = this.getNoteFrequency(rootNote, octave);
        
        // 和音の各音の周波数を計算
        const frequencies = chordStructure.map(semitones => 
            rootFreq * Math.pow(2, semitones / 12)
        );
        
        console.log(`AudioEngine: 和音を再生します - ${rootNote}${chordType} (${frequencies.join(', ')}Hz)`);
        
        if (isArpeggio) {
            // アルペジオ（順番に再生）
            const noteDuration = duration / frequencies.length;
            for (const freq of frequencies) {
                await this.playSingleFrequency(freq, noteDuration);
            }
            return Promise.resolve();
        } else {
            // 和音（同時に再生）
            return this.playMultipleFrequencies(frequencies, duration);
        }
    }
    
    /**
     * メロディ（音の配列）を再生
     * @param {Array<Object>} notes - 音符の配列（各要素は {note, octave, duration} の形式）
     * @param {number} tempo - テンポ（BPM）（デフォルト: 100）
     * @returns {Promise} 音の再生完了を表すPromise
     */
    async playMelody(notes, tempo = 100) {
        await this.ensureInitialized();
        
        console.log(`AudioEngine: メロディを再生します (${notes.length}音)`);
        
        // 1拍の長さを計算（秒）
        const beatDuration = 60 / tempo;
        
        for (const note of notes) {
            const duration = note.duration * beatDuration;
            
            if (note.note === 'rest') {
                // 休符の場合
                await this.wait(duration);
            } else {
                // 音符の場合
                await this.playNote(note.note, note.octave || 4, duration);
            }
        }
        
        return Promise.resolve();
    }
    
    /**
     * 単一の周波数を再生
     * @param {number} frequency - 周波数（Hz）
     * @param {number} duration - 再生時間（秒）
     * @returns {Promise} 音の再生完了を表すPromise
     */
    async playSingleFrequency(frequency, duration) {
        return new Promise(resolve => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // オシレーターの設定
            oscillator.type = 'sine'; // サイン波
            oscillator.frequency.value = frequency;
            
            // エンベロープの設定（アタックとリリースを滑らかに）
            const attackTime = 0.02;
            const releaseTime = 0.05;
            const now = this.audioContext.currentTime;
            
            // 接続
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            // ボリュームエンベロープ
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(1, now + attackTime);
            gainNode.gain.setValueAtTime(1, now + duration - releaseTime);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);
            
            // 再生開始
            oscillator.start(now);
            oscillator.stop(now + duration);
            
            // 管理用配列に追加
            this.activeOscillators.push(oscillator);
            
            // 終了時の処理
            oscillator.onended = () => {
                // 管理用配列から削除
                const index = this.activeOscillators.indexOf(oscillator);
                if (index !== -1) {
                    this.activeOscillators.splice(index, 1);
                }
                resolve();
            };
        });
    }
    
    /**
     * 複数の周波数を同時に再生
     * @param {Array<number>} frequencies - 周波数の配列（Hz）
     * @param {number} duration - 再生時間（秒）
     * @returns {Promise} 音の再生完了を表すPromise
     */
    async playMultipleFrequencies(frequencies, duration) {
        return new Promise(resolve => {
            const oscillators = [];
            const now = this.audioContext.currentTime;
            
            // 各周波数に対応するオシレーターを作成
            for (const frequency of frequencies) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                // オシレーターの設定
                oscillator.type = 'sine';
                oscillator.frequency.value = frequency;
                
                // エンベロープの設定
                const attackTime = 0.02;
                const releaseTime = 0.05;
                
                // 接続
                oscillator.connect(gainNode);
                gainNode.connect(this.masterGainNode);
                
                // ボリュームエンベロープ
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.8, now + attackTime);
                gainNode.gain.setValueAtTime(0.8, now + duration - releaseTime);
                gainNode.gain.linearRampToValueAtTime(0, now + duration);
                
                // 管理用配列に追加
                oscillators.push(oscillator);
                this.activeOscillators.push(oscillator);
                
                // 再生開始
                oscillator.start(now);
                oscillator.stop(now + duration);
            }
            
            // 最後のオシレーターの終了を待つ
            const lastOscillator = oscillators[oscillators.length - 1];
            lastOscillator.onended = () => {
                // 管理用配列から削除
                for (const osc of oscillators) {
                    const index = this.activeOscillators.indexOf(osc);
                    if (index !== -1) {
                        this.activeOscillators.splice(index, 1);
                    }
                }
                resolve();
            };
        });
    }
    
    /**
     * 指定した音階と音程から周波数を計算
     * @param {string} note - 音階の名前（例: 'C', 'D#'）
     * @param {number} octave - オクターブ
     * @returns {number} 周波数（Hz）
     */
    getNoteFrequency(note, octave) {
        const baseFreq = this.noteFrequencies[note];
        if (!baseFreq) {
            throw new Error(`無効な音階です: ${note}`);
        }
        
        // オクターブによる周波数の調整（C4が基準）
        const octaveDiff = octave - 4;
        return baseFreq * Math.pow(2, octaveDiff);
    }
    
    /**
     * 全ての再生中の音を停止
     */
    stopAllSounds() {
        if (!this.initialized) return;
        
        console.log('AudioEngine: 全ての音を停止します');
        
        // 再生中のオシレーターを全て停止
        const now = this.audioContext.currentTime;
        for (const osc of this.activeOscillators) {
            try {
                osc.stop(now);
            } catch (e) {
                // すでに停止している場合のエラーを無視
            }
        }
        
        // 配列をクリア
        this.activeOscillators = [];
    }
    
    /**
     * マスターボリュームの設定
     * @param {number} value - 0から1の間の値
     */
    setVolume(value) {
        if (!this.initialized) return;
        
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.volume;
        }
        
        console.log(`AudioEngine: ボリュームを設定しました (${this.volume})`);
    }
    
    /**
     * 指定した時間だけ待機する
     * @param {number} seconds - 待機時間（秒）
     * @returns {Promise} 待機完了を表すPromise
     */
    wait(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
    
    /**
     * オーディオコンテキストの状態を取得
     * @returns {string} 状態（'running', 'suspended', 'closed'のいずれか）
     */
    getAudioContextState() {
        if (!this.initialized) return 'not initialized';
        return this.audioContext.state;
    }
    
    /**
     * Web Audio APIがサポートされているかチェック
     * @returns {boolean} サポート状況
     */
    static isSupported() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }
}

// グローバルインスタンスの作成
const audioEngine = new AudioEngine();

console.log('AudioEngine: スクリプトの読み込みが完了しました');