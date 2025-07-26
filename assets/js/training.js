 /**
 * サウンドマスター - トレーニング機能
 * 音感トレーニングのコア機能を提供します
 */

class TrainingManager {
    constructor() {
        // DOM要素の参照
        this.playButton = document.getElementById('playSound');
        this.trainingModeSelect = document.getElementById('trainingMode');
        this.difficultySelect = document.getElementById('difficultyLevel');
        this.answersContainer = document.getElementById('answersContainer');
        this.resultFeedback = document.getElementById('resultFeedback');
        this.currentScoreDisplay = document.getElementById('currentScore');
        this.pianoKeyboard = document.getElementById('pianoKeyboard');
        this.chordButtons = document.getElementById('chordButtons');
        this.intervalButtons = document.getElementById('intervalButtons');
        
        // 統計表示要素
        this.accuracyDisplay = document.getElementById('accuracyRate');
        this.streakDisplay = document.getElementById('streakCount');
        this.totalCompletedDisplay = document.getElementById('totalCompleted');
        this.rankDisplay = document.getElementById('levelRank');
        
        // シェア関連
        this.shareButton = document.getElementById('shareResults');
        this.shareModal = document.getElementById('shareModal');
        this.shareText = document.getElementById('shareText');
        this.shareLink = document.getElementById('shareLink');
        this.twitterShare = document.getElementById('twitterShare');
        this.facebookShare = document.getElementById('facebookShare');
        this.lineShare = document.getElementById('lineShare');
        this.copyLink = document.getElementById('copyLink');
        
        // モードとトレーニングの状態
        this.currentMode = 'single-note';
        this.currentDifficulty = 'beginner';
        this.currentAnswer = null;
        this.isPlaying = false;
        this.isAnswerCorrect = null;
        
        // 統計データ
        this.stats = {
            totalAttempts: 0,
            correctAnswers: 0,
            currentStreak: 0,
            bestStreak: 0,
            currentScore: 0,
            modes: {
                'single-note': { attempts: 0, correct: 0 },
                'interval': { attempts: 0, correct: 0 },
                'chord': { attempts: 0, correct: 0 },
                'melody': { attempts: 0, correct: 0 },
                'rhythm': { attempts: 0, correct: 0 }
            }
        };
        
        // 難易度設定
        this.difficultySettings = {
            'beginner': {
                'single-note': {
                    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
                    octave: 4
                },
                'interval': {
                    types: ['3M', '5', '8'],
                    baseNotes: ['C', 'F', 'G']
                },
                'chord': {
                    types: ['maj', 'min'],
                    roots: ['C', 'F', 'G']
                }
            },
            'intermediate': {
                'single-note': {
                    notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
                    octave: 4
                },
                'interval': {
                    types: ['2M', '3m', '3M', '4', '5', '6M', '8'],
                    baseNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B']
                },
                'chord': {
                    types: ['maj', 'min', 'dim', 'aug'],
                    roots: ['C', 'D', 'E', 'F', 'G', 'A', 'B']
                }
            },
            'advanced': {
                'single-note': {
                    notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
                    octaves: [3, 4, 5]
                },
                'interval': {
                    types: ['2m', '2M', '3m', '3M', '4', '5', '6m', '6M', '7m', '7M', '8'],
                    baseNotes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
                },
                'chord': {
                    types: ['maj', 'min', 'dim', 'aug', 'sus4', 'sus2', '7', 'maj7'],
                    roots: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
                }
            }
        };
        
        // ローカライゼーション用の音名マッピング
        this.noteNamesJa = {
            'C': 'ド',
            'C#': 'ド#',
            'D': 'レ',
            'D#': 'レ#',
            'E': 'ミ',
            'F': 'ファ',
            'F#': 'ファ#',
            'G': 'ソ',
            'G#': 'ソ#',
            'A': 'ラ',
            'A#': 'ラ#',
            'B': 'シ'
        };
        
        // 音程の名前（日本語）
        this.intervalNamesJa = {
            '1': '完全一度',
            '2m': '短2度',
            '2M': '長2度',
            '3m': '短3度',
            '3M': '長3度',
            '4': '完全4度',
            '5': '完全5度',
            '6m': '短6度',
            '6M': '長6度',
            '7m': '短7度',
            '7M': '長7度',
            '8': 'オクターブ'
        };
        
        // 和音の名前（日本語）
        this.chordNamesJa = {
            'maj': 'メジャー',
            'min': 'マイナー',
            'dim': 'ディミニッシュ',
            'aug': 'オーグメント',
            'sus4': 'サスフォー',
            'sus2': 'サスツー',
            '7': 'セブンス',
            'maj7': 'メジャーセブンス'
        };
        
        // イベントリスナーの設定
        this.initEventListeners();
        
        // ローカルストレージから統計データを読み込む
        this.loadStats();
        
        // 初期UI設定
        this.updateUI();
        
        console.log('TrainingManager: インスタンスを作成しました');
    }
    
    /**
     * イベントリスナーの初期化
     */
    initEventListeners() {
        // 音を再生ボタン
        this.playButton.addEventListener('click', () => {
            this.playCurrentSound();
        });
        
        // トレーニングモード変更
        this.trainingModeSelect.addEventListener('change', () => {
            this.currentMode = this.trainingModeSelect.value;
            this.updateUI();
            this.generateNewQuestion();
            console.log(`TrainingManager: トレーニングモードを変更: ${this.currentMode}`);
        });
        
        // 難易度変更
        this.difficultySelect.addEventListener('change', () => {
            this.currentDifficulty = this.difficultySelect.value;
            this.updateUI();
            this.generateNewQuestion();
            console.log(`TrainingManager: 難易度を変更: ${this.currentDifficulty}`);
        });
        
        // ピアノキーボードのクリックイベント
        if (this.pianoKeyboard) {
            const keys = this.pianoKeyboard.querySelectorAll('.piano-key');
            keys.forEach(key => {
                key.addEventListener('click', () => {
                    const note = key.dataset.note;
                    this.checkAnswer(note);
                });
            });
        }
        
        // シェアボタン
        if (this.shareButton) {
            this.shareButton.addEventListener('click', () => {
                this.openShareModal();
            });
        }
        
        // シェアモーダルのボタン
        if (this.twitterShare) {
            this.twitterShare.addEventListener('click', () => {
                this.shareToTwitter();
            });
        }
        
        if (this.facebookShare) {
            this.facebookShare.addEventListener('click', () => {
                this.shareToFacebook();
            });
        }
        
        if (this.lineShare) {
            this.lineShare.addEventListener('click', () => {
                this.shareToLINE();
            });
        }
        
        if (this.copyLink) {
            this.copyLink.addEventListener('click', () => {
                this.copyShareLink();
            });
        }
        
        // モーダルを閉じるボタン
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        });
        
        // モーダル外クリックで閉じる
        window.addEventListener('click', (event) => {
            document.querySelectorAll('.modal').forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        console.log('TrainingManager: イベントリスナーを初期化しました');
    }
    
    /**
     * 現在のモードに応じてUIを更新
     */
    updateUI() {
        // 全ての回答コンテナを非表示
        if (this.pianoKeyboard) this.pianoKeyboard.style.display = 'none';
        if (this.chordButtons) this.chordButtons.style.display = 'none';
        if (this.intervalButtons) this.intervalButtons.style.display = 'none';
        
        // 現在のモードに応じた回答UIを表示
        switch (this.currentMode) {
            case 'single-note':
                if (this.pianoKeyboard) {
                    this.pianoKeyboard.style.display = 'flex';
                    this.updatePianoKeyboard();
                }
                break;
                
            case 'interval':
                if (this.intervalButtons) {
                    this.intervalButtons.style.display = 'flex';
                    this.updateIntervalButtons();
                }
                break;
                
            case 'chord':
                if (this.chordButtons) {
                    this.chordButtons.style.display = 'flex';
                    this.updateChordButtons();
                }
                break;
                
            case 'melody':
                // メロディモードのUI（未実装）
                break;
                
            case 'rhythm':
                // リズムモードのUI（未実装）
                break;
        }
        
        // 統計情報を更新
        this.updateStatsDisplay();
    }
    
    /**
     * ピアノキーボードUIの更新
     */
    updatePianoKeyboard() {
        const settings = this.difficultySettings[this.currentDifficulty]['single-note'];
        const keys = this.pianoKeyboard.querySelectorAll('.piano-key');
        
        // 全てのキーをリセット
        keys.forEach(key => {
            key.classList.remove('disabled');
            key.style.opacity = '1';
        });
        
        // 現在の難易度で利用可能な音のみ表示
        if (this.currentDifficulty !== 'advanced') {
            keys.forEach(key => {
                const note = key.dataset.note;
                if (!settings.notes.includes(note)) {
                    key.classList.add('disabled');
                    key.style.opacity = '0.5';
                }
            });
        }
    }
    
    /**
     * 音程ボタンUIの更新
     */
    updateIntervalButtons() {
        const settings = this.difficultySettings[this.currentDifficulty]['interval'];
        
        // ボタンをクリア
        this.intervalButtons.innerHTML = '';
        
        // 現在の難易度での音程ボタンを作成
        for (const intervalType of settings.types) {
            const button = document.createElement('button');
            button.textContent = this.intervalNamesJa[intervalType];
            button.dataset.interval = intervalType;
            button.addEventListener('click', () => {
                this.checkAnswer(intervalType);
            });
            
            this.intervalButtons.appendChild(button);
        }
    }
    
    /**
     * 和音ボタンUIの更新
     */
    updateChordButtons() {
        const settings = this.difficultySettings[this.currentDifficulty]['chord'];
        
        // ボタンをクリア
        this.chordButtons.innerHTML = '';
        
        // 現在の難易度での和音ボタンを作成
        for (const chordType of settings.types) {
            const button = document.createElement('button');
            button.textContent = this.chordNamesJa[chordType];
            button.dataset.chord = chordType;
            button.addEventListener('click', () => {
                this.checkAnswer(chordType);
            });
            
            this.chordButtons.appendChild(button);
        }
    }
    
    /**
     * 新しい問題を生成
     */
    generateNewQuestion() {
        if (this.isPlaying) return;
        
        this.isAnswerCorrect = null;
        this.resultFeedback.textContent = '';
        this.resultFeedback.className = 'result-feedback';
        
        switch (this.currentMode) {
            case 'single-note':
                this.generateSingleNoteQuestion();
                break;
            case 'interval':
                this.generateIntervalQuestion();
                break;
            case 'chord':
                this.generateChordQuestion();
                break;
            case 'melody':
                // メロディモードの問題生成（未実装）
                break;
            case 'rhythm':
                // リズムモードの問題生成（未実装）
                break;
        }
        
        console.log('TrainingManager: 新しい問題を生成しました');
    }
    
    /**
     * 単音モードの問題生成
     */
    generateSingleNoteQuestion() {
        const settings = this.difficultySettings[this.currentDifficulty]['single-note'];
        
        let notes = settings.notes;
        let octave = settings.octave;
        
        // 上級モードの場合、オクターブもランダムに
        if (this.currentDifficulty === 'advanced') {
            octave = settings.octaves[Math.floor(Math.random() * settings.octaves.length)];
        }
        
        // ランダムに音を選択
        const note = notes[Math.floor(Math.random() * notes.length)];
        
        this.currentAnswer = {
            note: note,
            octave: octave,
            type: 'single-note'
        };
    }
    
    /**
     * 音程モードの問題生成
     */
    generateIntervalQuestion() {
        const settings = this.difficultySettings[this.currentDifficulty]['interval'];
        
        // ランダムに基準音を選択
        const baseNote = settings.baseNotes[Math.floor(Math.random() * settings.baseNotes.length)];
        
        // ランダムに音程を選択
        const intervalType = settings.types[Math.floor(Math.random() * settings.types.length)];
        
        this.currentAnswer = {
            baseNote: baseNote,
            interval: intervalType,
            octave: 4,
            type: 'interval'
        };
    }
    
    /**
     * 和音モードの問題生成
     */
    generateChordQuestion() {
        const settings = this.difficultySettings[this.currentDifficulty]['chord'];
        
        // ランダムにルート音を選択
        const rootNote = settings.roots[Math.floor(Math.random() * settings.roots.length)];
        
        // ランダムに和音タイプを選択
        const chordType = settings.types[Math.floor(Math.random() * settings.types.length)];
        
        this.currentAnswer = {
            rootNote: rootNote,
            chordType: chordType,
            octave: 4,
            type: 'chord'
        };
    }
    
    /**
     * 現在の問題に対応する音を再生
     */
    async playCurrentSound() {
        if (!this.currentAnswer || this.isPlaying) return;
        
        this.isPlaying = true;
        this.playButton.disabled = true;
        this.playButton.textContent = '再生中...';
        
        try {
            switch (this.currentAnswer.type) {
                case 'single-note':
                    await audioEngine.playNote(
                        this.currentAnswer.note,
                        this.currentAnswer.octave,
                        1.0
                    );
                    break;
                    
                case 'interval':
                    await audioEngine.playInterval(
                        this.currentAnswer.baseNote,
                        this.currentAnswer.interval,
                        this.currentAnswer.octave,
                        1.0,
                        this.currentDifficulty === 'beginner' // 初級モードでは順番に再生
                    );
                    break;
                    
                case 'chord':
                    await audioEngine.playChord(
                        this.currentAnswer.rootNote,
                        this.currentAnswer.chordType,
                        this.currentAnswer.octave,
                        1.0,
                        this.currentDifficulty === 'beginner' // 初級モードではアルペジオで再生
                    );
                    break;
            }
            
            console.log('TrainingManager: 音を再生しました');
            
        } catch (error) {
            console.error('TrainingManager: 音の再生中にエラーが発生しました', error);
            this.resultFeedback.textContent = 'エラー: 音が再生できません';
            this.resultFeedback.className = 'result-feedback incorrect';
        }
        
        this.isPlaying = false;
        this.playButton.disabled = false;
        this.playButton.textContent = '音を再生';
    }
    
    /**
     * 回答をチェック
     * @param {string} answer - ユーザーの回答
     */
    checkAnswer(answer) {
        if (!this.currentAnswer || this.isPlaying || this.isAnswerCorrect !== null) return;
        
        let isCorrect = false;
        let correctText = '';
        let answerText = '';
        
        switch (this.currentAnswer.type) {
            case 'single-note':
                isCorrect = answer === this.currentAnswer.note;
                correctText = `${this.noteNamesJa[this.currentAnswer.note]}(${this.currentAnswer.note})`;
                answerText = `${this.noteNamesJa[answer]}(${answer})`;
                break;
                
            case 'interval':
                isCorrect = answer === this.currentAnswer.interval;
                correctText = this.intervalNamesJa[this.currentAnswer.interval];
                answerText = this.intervalNamesJa[answer];
                break;
                
            case 'chord':
                isCorrect = answer === this.currentAnswer.chordType;
                correctText = this.chordNamesJa[this.currentAnswer.chordType];
                answerText = this.chordNamesJa[answer];
                break;
        }
        
        this.isAnswerCorrect = isCorrect;
        
        // 統計を更新
        this.updateStats(isCorrect);
        
        // フィードバックを表示
        if (isCorrect) {
            this.resultFeedback.textContent = `正解！ ${correctText}`;
            this.resultFeedback.className = 'result-feedback correct';
            
            // 正解時の効果音（オプション）
            this.playCorrectSound();
            
        } else {
            this.resultFeedback.textContent = `不正解。正解: ${correctText} / あなたの回答: ${answerText}`;
            this.resultFeedback.className = 'result-feedback incorrect';
            
            // 不正解時の効果音（オプション）
            this.playIncorrectSound();
        }
        
        // 統計表示を更新
        this.updateStatsDisplay();
        
        // 統計をローカルストレージに保存
        this.saveStats();
        
        // 2秒後に次の問題を生成
        setTimeout(() => {
            this.generateNewQuestion();
        }, 2000);
        
        console.log(`TrainingManager: 回答をチェック - ${isCorrect ? '正解' : '不正解'}`);
    }
    
    /**
     * 統計データを更新
     * @param {boolean} isCorrect - 正解かどうか
     */
    updateStats(isCorrect) {
        this.stats.totalAttempts++;
        this.stats.modes[this.currentMode].attempts++;
        
        if (isCorrect) {
            this.stats.correctAnswers++;
            this.stats.modes[this.currentMode].correct++;
            this.stats.currentStreak++;
            this.stats.currentScore += this.getScoreForCurrentMode();
            
            if (this.stats.currentStreak > this.stats.bestStreak) {
                this.stats.bestStreak = this.stats.currentStreak;
            }
        } else {
            this.stats.currentStreak = 0;
        }
    }
    
    /**
     * 現在のモードでのスコアを計算
     * @returns {number} 獲得スコア
     */
    getScoreForCurrentMode() {
        const baseScore = {
            'single-note': 10,
            'interval': 15,
            'chord': 20,
            'melody': 25,
            'rhythm': 20
        };
        
        const difficultyMultiplier = {
            'beginner': 1.0,
            'intermediate': 1.5,
            'advanced': 2.0
        };
        
        return Math.round(baseScore[this.currentMode] * difficultyMultiplier[this.currentDifficulty]);
    }
    
    /**
     * 統計表示を更新
     */
    updateStatsDisplay() {
        if (this.accuracyDisplay) {
            const accuracy = this.stats.totalAttempts > 0 
                ? Math.round((this.stats.correctAnswers / this.stats.totalAttempts) * 100)
                : 0;
            this.accuracyDisplay.textContent = `${accuracy}%`;
        }
        
        if (this.streakDisplay) {
            this.streakDisplay.textContent = this.stats.currentStreak;
        }
        
        if (this.totalCompletedDisplay) {
            this.totalCompletedDisplay.textContent = this.stats.totalAttempts;
        }
        
        if (this.currentScoreDisplay) {
            this.currentScoreDisplay.textContent = this.stats.currentScore;
        }
        
        if (this.rankDisplay) {
            this.rankDisplay.textContent = this.getCurrentRank();
        }
    }
    
    /**
     * 現在のランクを計算
     * @returns {string} ランク名
     */
    getCurrentRank() {
        const score = this.stats.currentScore;
        
        if (score >= 10000) return 'マスター';
        if (score >= 5000) return 'エキスパート';
        if (score >= 2000) return 'アドバンス';
        if (score >= 1000) return 'インターミディエイト';
        if (score >= 500) return 'ビギナー+';
        if (score >= 100) return 'ビギナー';
        return '初心者';
    }
    
    /**
     * 正解時の効果音を再生
     */
    async playCorrectSound() {
        try {
            // 上昇するアルペジオ
            const notes = [
                { note: 'C', octave: 4, duration: 0.2 },
                { note: 'E', octave: 4, duration: 0.2 },
                { note: 'G', octave: 4, duration: 0.2 },
                { note: 'C', octave: 5, duration: 0.4 }
            ];
            
            await audioEngine.playMelody(notes, 200);
        } catch (error) {
            console.log('TrainingManager: 正解音の再生をスキップしました');
        }
    }
    
    /**
     * 不正解時の効果音を再生
     */
    async playIncorrectSound() {
        try {
            // 下降する音
            const notes = [
                { note: 'G', octave: 4, duration: 0.3 },
                { note: 'F', octave: 4, duration: 0.3 },
                { note: 'E', octave: 4, duration: 0.6 }
            ];
            
            await audioEngine.playMelody(notes, 120);
        } catch (error) {
            console.log('TrainingManager: 不正解音の再生をスキップしました');
        }
    }
    
    /**
     * シェアモーダルを開く
     */
    openShareModal() {
        const accuracy = this.stats.totalAttempts > 0 
            ? Math.round((this.stats.correctAnswers / this.stats.totalAttempts) * 100)
            : 0;
        
        const shareMessage = `音感トレーニング「サウンドマスター」で練習中！\n` +
                           `スコア: ${this.stats.currentScore}点\n` +
                           `正答率: ${accuracy}%\n` +
                           `連続正解: ${this.stats.currentStreak}回\n` +
                           `現在のランク: ${this.getCurrentRank()}\n` +
                           `#音感トレーニング #サウンドマスター #音楽`;
        
        if (this.shareText) {
            this.shareText.textContent = shareMessage;
        }
        
        if (this.shareLink) {
            this.shareLink.value = window.location.href;
        }
        
        if (this.shareModal) {
            this.shareModal.style.display = 'block';
        }
    }
    
    /**
     * Twitterでシェア
     */
    shareToTwitter() {
        const text = encodeURIComponent(this.shareText.textContent);
        const url = encodeURIComponent(window.location.href);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        
        window.open(twitterUrl, '_blank', 'width=550,height=420');
    }
    
    /**
     * Facebookでシェア
     */
    shareToFacebook() {
        const url = encodeURIComponent(window.location.href);
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        
        window.open(facebookUrl, '_blank', 'width=550,height=420');
    }
    
    /**
     * LINEでシェア
     */
    shareToLINE() {
        const text = encodeURIComponent(this.shareText.textContent);
        const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}&text=${text}`;
        
        window.open(lineUrl, '_blank', 'width=550,height=420');
    }
    
    /**
     * シェアリンクをコピー
     */
    async copyShareLink() {
        try {
            await navigator.clipboard.writeText(this.shareLink.value);
            
            // コピー成功のフィードバック
            const originalText = this.copyLink.textContent;
            this.copyLink.textContent = 'コピー済み!';
            this.copyLink.style.backgroundColor = '#2ecc71';
            
            setTimeout(() => {
                this.copyLink.textContent = originalText;
                this.copyLink.style.backgroundColor = '';
            }, 2000);
            
        } catch (error) {
            console.error('TrainingManager: クリップボードへのコピーに失敗しました', error);
            
            // フォールバック: テキストを選択状態にする
            this.shareLink.select();
            this.shareLink.setSelectionRange(0, 99999);
        }
    }
    
    /**
     * 統計データをローカルストレージから読み込み
     */
    loadStats() {
        try {
            const savedStats = localStorage.getItem('soundmaster-stats');
            if (savedStats) {
                const parsedStats = JSON.parse(savedStats);
                this.stats = { ...this.stats, ...parsedStats };
                console.log('TrainingManager: 統計データを読み込みました');
            }
        } catch (error) {
            console.error('TrainingManager: 統計データの読み込みに失敗しました', error);
        }
    }
    
    /**
     * 統計データをローカルストレージに保存
     */
    saveStats() {
        try {
            localStorage.setItem('soundmaster-stats', JSON.stringify(this.stats));
            console.log('TrainingManager: 統計データを保存しました');
        } catch (error) {
            console.error('TrainingManager: 統計データの保存に失敗しました', error);
        }
    }
    
    /**
     * 統計データをリセット
     */
    resetStats() {
        if (confirm('統計データをリセットしますか？この操作は元に戻せません。')) {
            this.stats = {
                totalAttempts: 0,
                correctAnswers: 0,
                currentStreak: 0,
                bestStreak: 0,
                currentScore: 0,
                modes: {
                    'single-note': { attempts: 0, correct: 0 },
                    'interval': { attempts: 0, correct: 0 },
                    'chord': { attempts: 0, correct: 0 },
                    'melody': { attempts: 0, correct: 0 },
                    'rhythm': { attempts: 0, correct: 0 }
                }
            };
            
            this.saveStats();
            this.updateStatsDisplay();
            
            console.log('TrainingManager: 統計データをリセットしました');
        }
    }
    
    /**
     * トレーニングを開始（初期問題の生成）
     */
    start() {
        console.log('TrainingManager: トレーニングを開始します');
        this.generateNewQuestion();
    }
}

// グローバルインスタンスの作成
let trainingManager;

// DOMが読み込まれたらトレーニングマネージャーを初期化
document.addEventListener('DOMContentLoaded', () => {
    trainingManager = new TrainingManager();
    
    // スタートボタンのイベントリスナーを設定
    const startButton = document.getElementById('startTraining');
    if (startButton) {
        startButton.addEventListener('click', async () => {
            // 音声エンジンの初期化
            const initialized = await audioEngine.initialize();
            if (initialized) {
                // トレーニングアプリのセクションまでスクロール
                const trainingSection = document.getElementById('trainingApp');
                if (trainingSection) {
                    trainingSection.scrollIntoView({ behavior: 'smooth' });
                }
                
                // トレーニング開始
                trainingManager.start();
                
                console.log('アプリケーション: トレーニングを開始しました');
            } else {
                alert('音声の初期化に失敗しました。ブラウザがWeb Audio APIをサポートしていない可能性があります。');
            }
        });
    }
});

console.log('TrainingManager: スクリプトの読み込みが完了しました');
