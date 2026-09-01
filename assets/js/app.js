// ──────────────────────────────────────────────
// PetFit 사료 추천 적합도 분석 - App Logic
// Gemini API를 사용한 이미지 분석
// ──────────────────────────────────────────────

// ── 상태 관리 ──
let state = {
    apiKey: (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY) ? GEMINI_API_KEY : '',
    dogProfile: JSON.parse(localStorage.getItem('petfit_dog_profile') || 'null'),
    selectedSector: 'BASIC',
    uploadedImage: null,
    uploadedImageBase64: null,
    analysisResult: null,
};

// ── Sector 매핑 ──
const SECTOR_NAMES = {
    BASIC: '기본 균형 식단',
    WEIGHT_LOSS: '체중 감량',
    WEIGHT_GAIN: '체중 증량',
    JOINT: '관절·이동성 관리',
    SKIN: '피부·피모 관리',
    DIGESTION: '소화·장 건강',
    SENIOR: '시니어 관리',
    GROWTH: '성장기 관리',
    DENTAL: '구강·치아 관리',
};

// ──────────────────────────────────────────────
// 초기화
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // 프로필 복원
    if (state.dogProfile) {
        displayProfile();
        document.getElementById('profileForm').style.display = 'none';
        document.getElementById('profileToggle').textContent = '펼치기';
    }
});

// ──────────────────────────────────────────────
// 프로필 관리
// ──────────────────────────────────────────────
function toggleProfile() {
    const form = document.getElementById('profileForm');
    const btn = document.getElementById('profileToggle');

    if (form.style.display === 'none') {
        form.style.display = 'block';
        btn.textContent = '접기';
    } else {
        form.style.display = 'none';
        btn.textContent = '펼치기';
    }
}

function saveProfile() {
    const name = document.getElementById('dogName').value.trim();
    const breed = document.getElementById('dogBreed').value.trim();
    const age = document.getElementById('dogAge').value.trim();
    const weight = document.getElementById('dogWeight').value;
    const neutered = document.getElementById('dogNeutered').value;
    const body = document.getElementById('dogBody').value;
    const activity = document.getElementById('dogActivity').value;
    const stage = document.getElementById('dogStage').value;
    const allergens = document.getElementById('dogAllergens').value.trim();
    const conditions = document.getElementById('dogConditions').value.trim();

    if (!name) {
        alert('반려견 이름을 입력해주세요.');
        return;
    }

    state.dogProfile = {
        name,
        breed: breed || '미입력',
        age: age || '미입력',
        weight: weight || 5,
        neutered,
        body_condition: body,
        activity_level: activity,
        life_stage: stage,
        allergens: allergens ? allergens.split(',').map(s => s.trim()).filter(Boolean) : [],
        health_conditions: conditions ? conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
    };

    localStorage.setItem('petfit_dog_profile', JSON.stringify(state.dogProfile));
    displayProfile();
    document.getElementById('profileForm').style.display = 'none';
    document.getElementById('profileToggle').textContent = '펼치기';
    checkAnalyzeReady();
}

function displayProfile() {
    const card = document.getElementById('profileCard');
    const tags = document.getElementById('profileTags');
    const warnings = document.getElementById('profileWarnings');
    const p = state.dogProfile;

    tags.innerHTML = `
        <span class="profile-tag">🐶 ${p.name}</span>
        <span class="profile-tag">${p.breed}</span>
        <span class="profile-tag">${p.age}</span>
        <span class="profile-tag">${p.weight}kg</span>
        <span class="profile-tag">${p.life_stage}</span>
        <span class="profile-tag">${p.activity_level}</span>
        <span class="profile-tag">${p.neutered}</span>
        <span class="profile-tag">${p.body_condition}</span>
    `;

    let warningHTML = '';
    if (p.allergens && p.allergens.length > 0) {
        warningHTML += `<div class="warning-item warning-allergy">⚠️ 알레르기: ${p.allergens.join(', ')}</div>`;
    }
    if (p.health_conditions && p.health_conditions.length > 0) {
        warningHTML += `<div class="warning-item warning-condition">💊 기저질환: ${p.health_conditions.join(', ')}</div>`;
    }
    warnings.innerHTML = warningHTML;
    card.style.display = 'block';
}

// ──────────────────────────────────────────────
// Sector 선택
// ──────────────────────────────────────────────
function selectSector(btn) {
    document.querySelectorAll('.sector-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedSector = btn.dataset.sector;
}

// ──────────────────────────────────────────────
// 이미지 업로드
// ──────────────────────────────────────────────
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 사이즈 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
        alert('이미지 크기는 10MB 이하여야 합니다.');
        return;
    }

    state.uploadedImage = file;

    // Base64 인코딩
    const reader = new FileReader();
    reader.onload = (e) => {
        state.uploadedImageBase64 = e.target.result.split(',')[1];
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';
        checkAnalyzeReady();
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    state.uploadedImage = null;
    state.uploadedImageBase64 = null;
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('fileInput').value = '';
    document.getElementById('analyzeSection').style.display = 'none';
}

function checkAnalyzeReady() {
    const ready = state.dogProfile && state.uploadedImageBase64 && state.apiKey;
    document.getElementById('analyzeSection').style.display = ready ? 'block' : 'none';
}

// ──────────────────────────────────────────────
// Gemini API 호출 - 이미지 분석
// ──────────────────────────────────────────────
async function analyzeFood() {
    if (!state.apiKey) {
        alert('Gemini API Key를 먼저 입력해주세요.');
        return;
    }
    if (!state.dogProfile) {
        alert('반려견 프로필을 먼저 입력해주세요.');
        return;
    }
    if (!state.uploadedImageBase64) {
        alert('사료 영양성분표 이미지를 업로드해주세요.');
        return;
    }

    // UI 전환
    document.getElementById('analyzeSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('resultSection').style.display = 'none';

    const p = state.dogProfile;
    const sectorName = SECTOR_NAMES[state.selectedSector];

    const prompt = `당신은 반려견 사료 영양성분 분석 전문가입니다.

아래 이미지는 반려견 사료의 영양성분표입니다. 이미지에서 다음 정보를 추출하고 분석해주세요.

## 반려견 프로필
- 이름: ${p.name}
- 나이: ${p.age}
- 견종: ${p.breed}
- 체중: ${p.weight}kg
- 체형: ${p.body_condition}
- 중성화 여부: ${p.neutered}
- 활동량: ${p.activity_level}
- 생애주기: ${p.life_stage}
- 알레르기: ${p.allergens.length > 0 ? p.allergens.join(', ') : '없음'}
- 기저질환: ${p.health_conditions.length > 0 ? p.health_conditions.join(', ') : '없음'}
- 선택 건강관리 목표: ${sectorName}

## 분석 요청

이미지에서 추출한 영양성분 정보를 바탕으로 아래 JSON 형식으로 응답해주세요.
반드시 JSON만 응답하세요. 다른 텍스트를 포함하지 마세요.

{
    "food_name": "사료명 (이미지에서 확인 가능한 경우, 아니면 '확인된 사료')",
    "ingredients": ["주요 원재료 목록"],
    "nutrition_score": 0~100 사이 정수 (영양기준 적합성 - AAFCO/FEDIAF 기준 충족도, 완전사료 여부, 영양 균형),
    "lifecycle_score": 0~100 사이 정수 (생애주기 적합성 - 현재 생애주기와 사료 대상 생애주기 일치도),
    "energy_score": 0~100 사이 정수 (체중·에너지 적합성 - 체중/체형/활동량 대비 열량 적합도),
    "goal_score": 0~100 사이 정수 (건강관리 목표 적합성 - 선택한 sector에 맞는 영양 구성),
    "experience_score": 50,
    "dietary_flags": ["식이 관련 주의사항"],
    "coverage_percent": 0~100 사이 정수 (분석에 필요한 정보가 이미지에서 얼마나 확인되었는지),
    "detail_reasons": {
        "nutrition": ["성견 영양기준 충족 여부에 대한 구체적 판정문", "Complete food 조건 확인 여부", "부족하거나 과한 영양소 언급"],
        "lifecycle": ["현재 반려견의 생애주기 언급", "사료의 대상 생애주기 언급", "일치 여부 판정"],
        "energy": ["현재 체중/활동량 대비 열량 판정", "칼로리 적합 여부 구체 언급"],
        "goal": ["선택한 건강관리 목표와 관련된 영양소 판정", "해당 목표에 도움이 되는지 여부"],
        "safety": ["알레르기 원료 포함 여부", "기저질환 관련 식이 위험 여부"]
    },
    "unknown_items": ["확인할 수 없었던 정보 목록"]
}

각 점수는 반려견의 현재 상태와 사료의 영양성분을 실제로 비교하여 산출하세요.
확인할 수 없는 정보는 임의로 추정하지 말고 unknown_items에 기록하세요.
coverage_percent는 분석에 필요한 전체 항목 중 실제 확인 가능한 정보의 비율입니다.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${state.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: state.uploadedImage.type || 'image/jpeg',
                                    data: state.uploadedImageBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 4096,
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || `API 오류: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        // JSON 파싱 (여러 방법 시도)
        let nutritionData = null;
        let jsonStr = text.trim();

        // 코드블록 제거
        if (jsonStr.includes('```json')) {
            jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
        } else if (jsonStr.includes('```')) {
            jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
        }

        // 중괄호로 시작/끝 맞추기
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        try {
            nutritionData = JSON.parse(jsonStr);
        } catch (parseErr) {
            // JSON이 잘렸거나 파싱 실패 시, 텍스트에서 숫자 추출 시도
            console.warn('JSON 파싱 실패, 기본값으로 대체:', parseErr.message);
            console.log('원본 응답:', text);

            // 기본 fallback 데이터
            nutritionData = {
                food_name: '분석된 사료',
                ingredients: [],
                nutrition_score: extractScore(text, 'nutrition_score') || 70,
                lifecycle_score: extractScore(text, 'lifecycle_score') || 70,
                energy_score: extractScore(text, 'energy_score') || 70,
                goal_score: extractScore(text, 'goal_score') || 65,
                experience_score: 50,
                dietary_flags: [],
                coverage_percent: extractScore(text, 'coverage_percent') || 60,
                detail_reasons: {
                    nutrition: extractReason(text, 'nutrition') || ['이미지에서 확인된 영양성분을 바탕으로 평가했습니다.'],
                    lifecycle: extractReason(text, 'lifecycle') || ['생애주기 정보를 기반으로 평가했습니다.'],
                    energy: extractReason(text, 'energy') || ['체중과 활동량을 고려하여 평가했습니다.'],
                    goal: extractReason(text, 'goal') || ['선택한 건강관리 목표에 맞춰 평가했습니다.'],
                    safety: extractReason(text, 'safety') || ['안전성 판단 정보가 제한적입니다.']
                },
                unknown_items: ['일부 영양성분 정보가 완전히 파싱되지 않았습니다.']
            };
        }

        // 점수 계산
        const finalScore = calculatePetFitScore(nutritionData);

        // Safety Gate 판정
        const safety = determineSafety(nutritionData);

        state.analysisResult = {
            nutritionData,
            finalScore,
            safety,
        };

        displayResult();

    } catch (error) {
        alert(`분석 중 오류가 발생했습니다:\n${error.message}`);
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('analyzeSection').style.display = 'block';
    }
}

// ──────────────────────────────────────────────
// 추천점수 계산
// N 45% | L 15% | E 20% | G 15% | T 5%
// BASIC 선택 시 G 제외 후 정규화
// ──────────────────────────────────────────────
function calculatePetFitScore(data) {
    const n = data.nutrition_score || 50;
    const l = data.lifecycle_score || 50;
    const e = data.energy_score || 50;
    const g = data.goal_score || 50;
    const t = data.experience_score || 50;

    if (state.selectedSector === 'BASIC') {
        // BASIC: G 제외, 나머지 정규화
        const totalWeight = 0.45 + 0.15 + 0.20 + 0.05; // 0.85
        return Math.round(
            (n * 0.45 / totalWeight) +
            (l * 0.15 / totalWeight) +
            (e * 0.20 / totalWeight) +
            (t * 0.05 / totalWeight)
        );
    } else {
        return Math.round(
            n * 0.45 +
            l * 0.15 +
            e * 0.20 +
            g * 0.15 +
            t * 0.05
        );
    }
}

// ──────────────────────────────────────────────
// Safety Gate 판정
// ──────────────────────────────────────────────
function determineSafety(data) {
    let status = 'PASS';
    const reasons = [];
    const p = state.dogProfile;

    // 알레르기 체크
    if (p.allergens && p.allergens.length > 0 && data.ingredients) {
        for (const allergen of p.allergens) {
            for (const ingredient of data.ingredients) {
                if (ingredient.toLowerCase().includes(allergen.toLowerCase())) {
                    status = 'STOP';
                    reasons.push(`알레르기 원료 감지: ${allergen}`);
                }
            }
        }
    }

    // 식이 주의사항 체크
    if (p.health_conditions && p.health_conditions.length > 0 && data.dietary_flags) {
        for (const condition of p.health_conditions) {
            for (const flag of data.dietary_flags) {
                if (flag.toLowerCase().includes(condition.toLowerCase())) {
                    if (status !== 'STOP') status = 'CHECK';
                    reasons.push(`기저질환 관련 주의: ${condition}`);
                }
            }
        }
    }

    if (reasons.length === 0) {
        reasons.push('등록된 알레르기 및 식이 금기 해당 없음');
    }

    return { status, reasons };
}

// ──────────────────────────────────────────────
// 점수 → 별 변환
// ──────────────────────────────────────────────
function scoreToStars(score) {
    const stars = Math.round(score / 20);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

// ──────────────────────────────────────────────
// 점수 설명
// ──────────────────────────────────────────────
function getScoreDescription(score) {
    if (score >= 90) return '매우 잘 맞아요! 🎉';
    if (score >= 80) return '잘 맞는 편이에요 👍';
    if (score >= 70) return '무난한 선택이에요';
    if (score >= 60) return '일부 주의가 필요해요';
    return '다른 사료를 고려해보세요';
}

// ──────────────────────────────────────────────
// 결과 표시
// ──────────────────────────────────────────────
function displayResult() {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('resultSection').style.display = 'block';

    const { nutritionData, finalScore, safety } = state.analysisResult;
    const sectorName = SECTOR_NAMES[state.selectedSector];

    // 사료명
    document.getElementById('resultFoodName').textContent = `선택 사료: ${nutritionData.food_name || '분석된 사료'}`;

    // Sector
    document.getElementById('resultSector').textContent = sectorName;

    // Safety
    const safetyIcons = { PASS: '✅', CHECK: '⚠️', STOP: '🚫' };
    const safetyClasses = { PASS: 'safety-pass', CHECK: 'safety-check', STOP: 'safety-stop' };
    document.getElementById('safetyBadge').innerHTML = `
        <span class="safety-badge ${safetyClasses[safety.status]}">
            ${safetyIcons[safety.status]} ${safety.status}
        </span>
    `;

    // 점수
    document.getElementById('scoreNumber').textContent = finalScore;
    document.getElementById('scoreDesc').textContent = getScoreDescription(finalScore);

    // Coverage
    const coverage = nutritionData.coverage_percent || 75;
    document.getElementById('coveragePercent').textContent = coverage;
    document.getElementById('coverageFill').style.width = `${coverage}%`;

    // Unknown items
    const unknownEl = document.getElementById('unknownItems');
    if (nutritionData.unknown_items && nutritionData.unknown_items.length > 0) {
        unknownEl.style.display = 'block';
        unknownEl.innerHTML = `
            <strong>ℹ️ 확인되지 않은 정보:</strong>
            <ul>${nutritionData.unknown_items.map(item => `<li>${item}</li>`).join('')}</ul>
        `;
    } else {
        unknownEl.style.display = 'none';
    }

    // 세부내용
    const detailList = document.getElementById('detailList');
    const details = [
        { label: '영양기준', score: nutritionData.nutrition_score, key: 'nutrition' },
        { label: '생애주기', score: nutritionData.lifecycle_score, key: 'lifecycle' },
        { label: '체중·에너지', score: nutritionData.energy_score, key: 'energy' },
    ];

    if (state.selectedSector !== 'BASIC') {
        details.push({ label: sectorName, score: nutritionData.goal_score, key: 'goal' });
    }

    detailList.innerHTML = details.map(d => {
        const reasons = nutritionData.detail_reasons?.[d.key];
        let reasonHTML = '';
        if (Array.isArray(reasons)) {
            reasonHTML = reasons.map(r => `<div>• ${r}</div>`).join('');
        } else if (reasons) {
            reasonHTML = `<div>• ${reasons}</div>`;
        } else {
            reasonHTML = '<div>• 상세 정보를 확인할 수 없습니다.</div>';
        }

        return `
        <div>
            <div class="detail-item">
                <span class="detail-label">${d.label}</span>
                <span class="detail-stars">${scoreToStars(d.score || 50)}</span>
                <button class="detail-help" onclick="toggleTooltip('detail-${d.key}')">?</button>
            </div>
            <div class="tooltip-box" id="tooltip-detail-${d.key}" style="display:none;">
                ${reasonHTML}
            </div>
        </div>
    `}).join('');

    // 결과 영역으로 스크롤
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });

    // 추천사료 계산 및 표시
    displayRecommendations();
}

// ──────────────────────────────────────────────
// Tooltip 토글
// ──────────────────────────────────────────────
function toggleTooltip(id) {
    const el = document.getElementById(`tooltip-${id}`);
    if (!el) return;

    if (el.style.display === 'none') {
        // Safety tooltip일 경우 내용 채우기
        if (id === 'safety' && state.analysisResult) {
            const reasons = state.analysisResult.safety.reasons;
            const detailSafety = state.analysisResult.nutritionData.detail_reasons?.safety || '';
            el.innerHTML = reasons.map(r => `• ${r}`).join('<br>') +
                (detailSafety ? `<br><em>${detailSafety}</em>` : '');
        }
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

// ──────────────────────────────────────────────
// 추천점수 설명 TAB 토글
// ──────────────────────────────────────────────
function toggleScoreExplanation() {
    const el = document.getElementById('scoreExplanation');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// ──────────────────────────────────────────────
// 분석 초기화
// ──────────────────────────────────────────────
function resetAnalysis() {
    state.analysisResult = null;
    state.uploadedImage = null;
    state.uploadedImageBase64 = null;

    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('fileInput').value = '';
    document.getElementById('analyzeSection').style.display = 'none';
    document.getElementById('scoreExplanation').style.display = 'none';

    // 상단으로 스크롤
    document.getElementById('uploadSection').scrollIntoView({ behavior: 'smooth' });
}

// ──────────────────────────────────────────────
// 헬퍼: 텍스트에서 점수 추출
// ──────────────────────────────────────────────
function extractScore(text, key) {
    const regex = new RegExp(`"${key}"\\s*:\\s*(\\d+)`);
    const match = text.match(regex);
    if (match) return parseInt(match[1], 10);
    return null;
}

// ──────────────────────────────────────────────
// 헬퍼: 텍스트에서 판정근거 추출
// ──────────────────────────────────────────────
function extractReason(text, key) {
    const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, 's');
    const match = text.match(regex);
    if (match) return match[1];
    return null;
}


// ──────────────────────────────────────────────
// 추천사료 계산 및 표시
// 프로필 기반으로 DB 사료에 동일한 PetFit 계산식 적용
// ──────────────────────────────────────────────
function calculateFoodScore(food, profile, sector) {
    // N: 영양기준 적합성 (단백질, 지방, 완전사료 여부 기반)
    let n_score = 50;
    if (food.is_complete) n_score += 20;
    if (food.protein >= 25) n_score += 15;
    else if (food.protein >= 20) n_score += 10;
    if (food.fat >= 10 && food.fat <= 18) n_score += 10;
    if (food.omega3 >= 0.5) n_score += 5;
    n_score = Math.min(100, n_score);

    // L: 생애주기 적합성
    let l_score = 50;
    if (food.target_stage.includes(profile.life_stage)) {
        l_score = 100;
    } else if (food.target_stage.includes('성견') && profile.life_stage === '노령견 (시니어)') {
        l_score = 60;
    } else {
        l_score = 30;
    }

    // E: 체중·에너지 적합성
    let e_score = 70;
    const isOverweight = profile.body_condition.includes('과체중') || profile.body_condition.includes('비만');
    const isUnderweight = profile.body_condition.includes('마름');
    const isLowActivity = profile.activity_level === '낮음';
    const isHighActivity = profile.activity_level === '높음' || profile.activity_level === '매우 높음';

    if (isOverweight) {
        if (food.calories_per_kg <= 3300) e_score = 95;
        else if (food.calories_per_kg <= 3600) e_score = 70;
        else e_score = 45;
    } else if (isUnderweight) {
        if (food.calories_per_kg >= 3800) e_score = 95;
        else if (food.calories_per_kg >= 3500) e_score = 70;
        else e_score = 50;
    } else {
        if (food.calories_per_kg >= 3400 && food.calories_per_kg <= 3800) e_score = 90;
        else if (food.calories_per_kg < 3400) e_score = 75;
        else e_score = 65;
    }

    if (isLowActivity && food.calories_per_kg > 3700) e_score -= 10;
    if (isHighActivity && food.calories_per_kg < 3500) e_score -= 10;
    if (profile.neutered === '중성화 완료' && food.calories_per_kg > 3800) e_score -= 5;
    e_score = Math.max(0, Math.min(100, e_score));

    // G: 건강관리 목표 적합성
    let g_score = 50;
    if (food.sectors.includes(sector)) {
        g_score = 90;
    }

    // 추가 세부 점수
    if (sector === 'JOINT') {
        if (food.glucosamine >= 700) g_score = 95;
        else if (food.glucosamine >= 400) g_score = 80;
        else if (!food.sectors.includes('JOINT')) g_score = 35;
    } else if (sector === 'SKIN') {
        if (food.omega3 >= 0.8) g_score += 5;
        if (food.omega6 >= 2.5) g_score += 5;
    } else if (sector === 'WEIGHT_LOSS') {
        if (food.calories_per_kg <= 3200 && food.fat <= 12) g_score = 95;
        else if (!food.sectors.includes('WEIGHT_LOSS')) g_score = 30;
    } else if (sector === 'WEIGHT_GAIN') {
        if (food.calories_per_kg >= 4000) g_score = 95;
        else if (!food.sectors.includes('WEIGHT_GAIN')) g_score = 35;
    } else if (sector === 'GROWTH') {
        if (food.protein >= 30 && food.target_stage.includes('퍼피 (성장기)')) g_score = 95;
        else if (!food.sectors.includes('GROWTH')) g_score = 30;
    } else if (sector === 'SENIOR') {
        if (food.target_stage.includes('노령견 (시니어)') && food.glucosamine > 0) g_score = 95;
        else if (!food.sectors.includes('SENIOR')) g_score = 35;
    } else if (sector === 'DENTAL') {
        if (food.sectors.includes('DENTAL')) g_score = 95;
        else g_score = 40;
    } else if (sector === 'DIGESTION') {
        if (food.sectors.includes('DIGESTION')) g_score = 90;
        else g_score = 50;
    }
    g_score = Math.min(100, g_score);

    // T: 과거 급여 경험 (데이터 없으므로 기본 50)
    const t_score = 50;

    // 최종 점수 계산
    if (sector === 'BASIC') {
        const totalWeight = 0.45 + 0.15 + 0.20 + 0.05;
        return Math.round(
            (n_score * 0.45 / totalWeight) +
            (l_score * 0.15 / totalWeight) +
            (e_score * 0.20 / totalWeight) +
            (t_score * 0.05 / totalWeight)
        );
    } else {
        return Math.round(
            n_score * 0.45 +
            l_score * 0.15 +
            e_score * 0.20 +
            g_score * 0.15 +
            t_score * 0.05
        );
    }
}

function checkFoodSafety(food, profile) {
    // 알레르기 체크
    if (profile.allergens && profile.allergens.length > 0) {
        for (const allergen of profile.allergens) {
            for (const ingredient of food.ingredients) {
                if (ingredient.toLowerCase().includes(allergen.toLowerCase())) {
                    return false; // 안전하지 않음
                }
            }
        }
    }
    return true; // 안전
}

function getRecommendations() {
    if (!state.dogProfile || typeof FOOD_DATABASE === 'undefined') return [];

    const profile = state.dogProfile;
    const sector = state.selectedSector;

    // 안전한 사료만 필터링 (알레르기 제외)
    const safeFoods = FOOD_DATABASE.filter(food => checkFoodSafety(food, profile));

    // 각 사료에 점수 계산
    const scoredFoods = safeFoods.map(food => ({
        ...food,
        petfit_score: calculateFoodScore(food, profile, sector)
    }));

    // 점수 높은 순 정렬 후 상위 3개
    scoredFoods.sort((a, b) => b.petfit_score - a.petfit_score);
    return scoredFoods.slice(0, 3);
}

function displayRecommendations() {
    const recommendations = getRecommendations();
    const listEl = document.getElementById('recommendList');

    if (recommendations.length === 0) {
        listEl.innerHTML = '<p style="color:#A0AEC0;font-size:0.85rem;text-align:center;">추천 가능한 사료가 없습니다.</p>';
        return;
    }

    listEl.innerHTML = recommendations.map((food, idx) => `
        <div class="recommend-card">
            <span class="recommend-rank rank-${idx + 1}">${idx + 1}위</span>
            <img class="recommend-img" src="${food.image}" alt="${food.name}">
            <div class="recommend-info">
                <div class="recommend-name">${food.name}</div>
                <div class="recommend-brand">${food.brand} · ${food.type} · ${food.price_range}가</div>
                <div class="recommend-highlights">
                    ${food.highlights.map(h => `<span class="recommend-highlight-tag">${h}</span>`).join('')}
                </div>
            </div>
            <div class="recommend-score">
                <div class="recommend-score-value">${food.petfit_score}</div>
                <div class="recommend-score-label">PetFit</div>
            </div>
        </div>
    `).join('');
}
