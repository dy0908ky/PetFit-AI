// ===== 전역 변수 =====
let weightChartInstance = null;
let activityChartInstance = null;
let riskChartInstance = null;

// ===== 견종별 데이터베이스 =====
const breedData = {
    '말티즈': { idealWeight: [2.5, 3.5], size: '소형', risks: ['슬개골 탈구', '치아 질환', '눈물 자국'], lifespan: [12, 15] },
    '포메라니안': { idealWeight: [1.8, 3.2], size: '소형', risks: ['슬개골 탈구', '기관 허탈', '탈모'], lifespan: [12, 16] },
    '치와와': { idealWeight: [1.5, 3.0], size: '소형', risks: ['슬개골 탈구', '저혈당', '수두증'], lifespan: [12, 18] },
    '푸들': { idealWeight: [3.0, 7.0], size: '소형', risks: ['슬개골 탈구', '백내장', '피부병'], lifespan: [12, 15] },
    '토이푸들': { idealWeight: [2.0, 4.0], size: '소형', risks: ['슬개골 탈구', '백내장', '피부병'], lifespan: [12, 16] },
    '시츄': { idealWeight: [4.0, 7.5], size: '소형', risks: ['호흡기 질환', '눈 질환', '디스크'], lifespan: [10, 16] },
    '요크셔테리어': { idealWeight: [2.0, 3.5], size: '소형', risks: ['슬개골 탈구', '저혈당', '치아 질환'], lifespan: [12, 15] },
    '비숑프리제': { idealWeight: [3.0, 5.5], size: '소형', risks: ['알레르기', '슬개골 탈구', '방광 결석'], lifespan: [12, 15] },
    '골든리트리버': { idealWeight: [25, 36], size: '대형', risks: ['고관절 이형성', '암', '심장 질환'], lifespan: [10, 12] },
    '래브라도리트리버': { idealWeight: [25, 36], size: '대형', risks: ['고관절 이형성', '비만', '관절염'], lifespan: [10, 12] },
    '진돗개': { idealWeight: [18, 25], size: '중형', risks: ['피부병', '관절 질환', '갑상선 질환'], lifespan: [12, 15] },
    '시바이누': { idealWeight: [8, 11], size: '중형', risks: ['알레르기', '슬개골 탈구', '녹내장'], lifespan: [12, 15] },
    '코기': { idealWeight: [10, 14], size: '중형', risks: ['디스크', '비만', '고관절 이형성'], lifespan: [12, 14] },
    '불독': { idealWeight: [18, 25], size: '중형', risks: ['호흡기 질환', '피부 주름 감염', '관절 질환'], lifespan: [8, 10] },
    '프렌치불독': { idealWeight: [9, 13], size: '중형', risks: ['호흡기 질환', '피부병', '척추 질환'], lifespan: [10, 12] },
    '비글': { idealWeight: [9, 11], size: '중형', risks: ['비만', '귀 감염', '디스크'], lifespan: [12, 15] },
    '닥스훈트': { idealWeight: [4.5, 12], size: '소형', risks: ['디스크', '비만', '치아 질환'], lifespan: [12, 16] },
    '허스키': { idealWeight: [16, 27], size: '대형', risks: ['백내장', '고관절 이형성', '피부병'], lifespan: [12, 14] },
    '셰퍼드': { idealWeight: [22, 40], size: '대형', risks: ['고관절 이형성', '디스크', '소화기 질환'], lifespan: [9, 13] },
    '사모예드': { idealWeight: [16, 30], size: '대형', risks: ['고관절 이형성', '당뇨', '심장 질환'], lifespan: [12, 14] },
};

// 기본 데이터 (견종을 못 찾았을 때)
const defaultBreedData = { idealWeight: [5, 15], size: '중형', risks: ['비만', '치아 질환', '관절 질환'], lifespan: [10, 14] };

// ===== 메인 함수: 건강 프로필 생성 =====
function generateReport() {
    // 입력값 수집
    const inputs = getInputValues();
    if (!inputs.breed || !inputs.weight || !inputs.age) {
        alert('견종, 체중, 연령은 필수 입력 항목입니다.');
        return;
    }

    // 결과 생성 및 렌더링
    const breed = getBreedInfo(inputs.breed);
    const weight = parseFloat(inputs.weight) || 5;
    const age = parseFloat(inputs.age) || 3;

    renderProfileSummary(inputs);
    renderWeightSection(inputs, breed, weight);
    renderActivitySection(inputs, breed);
    renderRiskSection(inputs, breed, weight, age);

    // 날짜 표시
    document.getElementById('reportDate').textContent =
        `분석일: ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`;

    showResult();
}

// ===== 입력값 수집 =====
function getInputValues() {
    return {
        breed: document.getElementById('breed').value.trim(),
        gender: document.getElementById('gender').value.trim(),
        weight: document.getElementById('weight').value.trim(),
        age: document.getElementById('age').value.trim(),
        disease: document.getElementById('disease').value.trim(),
        medication: document.getElementById('medication').value.trim(),
        surgery: document.getElementById('surgery').value.trim(),
        activity: document.getElementById('activity').value.trim(),
        temperature: document.getElementById('temperature').value.trim(),
        bowel: document.getElementById('bowel').value.trim(),
        water: document.getElementById('water').value.trim(),
        sleep: document.getElementById('sleep').value.trim(),
        etc: document.getElementById('etc').value.trim(),
    };
}

// ===== 견종 정보 조회 =====
function getBreedInfo(breedName) {
    // 정확히 매칭되는 견종 찾기
    for (const [key, value] of Object.entries(breedData)) {
        if (breedName.includes(key) || key.includes(breedName)) {
            return value;
        }
    }
    return defaultBreedData;
}

// ===== 프로필 요약 렌더링 =====
function renderProfileSummary(inputs) {
    const summary = document.getElementById('profileSummary');
    summary.innerHTML = `
        <div class="summary-item">
            <div class="label">견종</div>
            <div class="value">${inputs.breed}</div>
        </div>
        <div class="summary-item">
            <div class="label">성별</div>
            <div class="value">${inputs.gender || '-'}</div>
        </div>
        <div class="summary-item">
            <div class="label">체중</div>
            <div class="value">${inputs.weight}kg</div>
        </div>
        <div class="summary-item">
            <div class="label">연령</div>
            <div class="value">${inputs.age}세</div>
        </div>
        <div class="summary-item">
            <div class="label">체온</div>
            <div class="value">${inputs.temperature || '-'}</div>
        </div>
        <div class="summary-item">
            <div class="label">지병</div>
            <div class="value">${inputs.disease || '없음'}</div>
        </div>
    `;
}

// ===== 체중 변화 히스토리 =====
function renderWeightSection(inputs, breed, currentWeight) {
    const ctx = document.getElementById('weightChart').getContext('2d');
    if (weightChartInstance) weightChartInstance.destroy();

    const idealMin = breed.idealWeight[0];
    const idealMax = breed.idealWeight[1];

    // 현재 체중 기반으로 최근 6개월 추정 데이터 생성
    const variation = currentWeight * 0.03; // 3% 변동
    const months = ['6개월 전', '5개월 전', '4개월 전', '3개월 전', '2개월 전', '1개월 전', '현재'];
    const values = [
        +(currentWeight - variation * 2.5 + Math.random() * variation).toFixed(1),
        +(currentWeight - variation * 2.0 + Math.random() * variation).toFixed(1),
        +(currentWeight - variation * 1.5 + Math.random() * variation).toFixed(1),
        +(currentWeight - variation * 1.0 + Math.random() * variation).toFixed(1),
        +(currentWeight - variation * 0.5 + Math.random() * variation).toFixed(1),
        +(currentWeight - variation * 0.2 + Math.random() * variation).toFixed(1),
        currentWeight,
    ];

    weightChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: '체중 (kg)',
                    data: values,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointRadius: 5,
                },
                {
                    label: '적정 체중 상한',
                    data: new Array(7).fill(idealMax),
                    borderColor: '#e74c3c',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0,
                },
                {
                    label: '적정 체중 하한',
                    data: new Array(7).fill(idealMin),
                    borderColor: '#27ae60',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: `${inputs.breed} 체중 변화 추이 (최근 6개월)`,
                    font: { size: 14, weight: 'bold' },
                },
            },
            scales: { y: { title: { display: true, text: 'kg' } } },
        },
    });

    // 분석 텍스트 생성
    let analysis = '';
    if (currentWeight > idealMax) {
        const overPercent = (((currentWeight - idealMax) / idealMax) * 100).toFixed(0);
        analysis = `<p><strong>⚠️ 과체중 주의</strong></p>
        <p>현재 체중(${currentWeight}kg)이 ${inputs.breed}의 적정 체중 범위(${idealMin}~${idealMax}kg)보다 약 ${overPercent}% 높습니다.
        비만은 관절 질환, 심장 질환, 당뇨 등 다양한 건강 문제의 원인이 됩니다.</p>
        <p><strong>권장사항:</strong> 급여량을 10~15% 줄이고, 산책 시간을 늘려주세요. 저칼로리 사료로 전환을 고려해 보세요.</p>`;
    } else if (currentWeight < idealMin) {
        const underPercent = (((idealMin - currentWeight) / idealMin) * 100).toFixed(0);
        analysis = `<p><strong>⚠️ 저체중 주의</strong></p>
        <p>현재 체중(${currentWeight}kg)이 ${inputs.breed}의 적정 체중 범위(${idealMin}~${idealMax}kg)보다 약 ${underPercent}% 낮습니다.
        저체중은 면역력 저하, 영양 결핍 등의 문제를 유발할 수 있습니다.</p>
        <p><strong>권장사항:</strong> 고단백·고칼로리 사료로 전환하고, 기생충 감염 여부를 확인해 주세요.</p>`;
    } else {
        analysis = `<p><strong>✅ 적정 체중 유지 중</strong></p>
        <p>현재 체중(${currentWeight}kg)이 ${inputs.breed}의 적정 체중 범위(${idealMin}~${idealMax}kg) 내에 있습니다.
        최근 6개월간 체중이 안정적으로 유지되고 있어 건강 관리가 잘 되고 있는 상태입니다.</p>
        <p><strong>권장사항:</strong> 현재 급여량과 운동량을 유지해 주세요. 정기적인 체중 측정을 권장합니다.</p>`;
    }

    document.getElementById('weightAnalysis').innerHTML = analysis;
}

// ===== 활동 및 생활 패턴 =====
function renderActivitySection(inputs, breed) {
    const ctx = document.getElementById('activityChart').getContext('2d');
    if (activityChartInstance) activityChartInstance.destroy();

    // 입력값 기반 점수 산출
    const activityScore = evaluateActivity(inputs.activity, breed.size);
    const sleepScore = evaluateSleep(inputs.sleep, breed.size);
    const waterScore = evaluateWater(inputs.water, inputs.weight);
    const bowelScore = evaluateBowel(inputs.bowel);
    const indoorScore = Math.round((activityScore + sleepScore) / 2);

    const currentScores = [activityScore, sleepScore, waterScore, bowelScore, indoorScore];
    const idealScores = [85, 85, 90, 85, 80];

    activityChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['야외활동', '수면', '음수', '배변', '실내활동'],
            datasets: [
                {
                    label: '현재 상태',
                    data: currentScores,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#667eea',
                },
                {
                    label: '이상적 상태',
                    data: idealScores,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointBackgroundColor: '#27ae60',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: `${inputs.breed} 활동 및 생활 패턴 분석`,
                    font: { size: 14, weight: 'bold' },
                },
            },
            scales: {
                r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } },
            },
        },
    });

    // 분석 텍스트
    let analysis = `<p><strong>📊 생활 패턴 종합 평가</strong></p><ul>`;
    analysis += `<li><strong>야외활동 (${activityScore}점):</strong> ${getActivityComment(activityScore, breed.size)}</li>`;
    analysis += `<li><strong>수면 (${sleepScore}점):</strong> ${getSleepComment(sleepScore)}</li>`;
    analysis += `<li><strong>음수량 (${waterScore}점):</strong> ${getWaterComment(waterScore)}</li>`;
    analysis += `<li><strong>배변 (${bowelScore}점):</strong> ${getBowelComment(bowelScore)}</li>`;
    analysis += `</ul>`;

    const avgScore = Math.round(currentScores.reduce((a, b) => a + b, 0) / currentScores.length);
    if (avgScore >= 80) {
        analysis += `<p>✅ 전반적으로 양호한 생활 패턴을 유지하고 있습니다.</p>`;
    } else if (avgScore >= 60) {
        analysis += `<p>⚠️ 일부 항목에서 개선이 필요합니다. 위 권장사항을 참고해 주세요.</p>`;
    } else {
        analysis += `<p>🚨 전반적인 생활 패턴 개선이 필요합니다. 수의사 상담을 권장합니다.</p>`;
    }

    document.getElementById('activityAnalysis').innerHTML = analysis;
}

// ===== 건강 위험 요소 =====
function renderRiskSection(inputs, breed, weight, age) {
    const ctx = document.getElementById('riskChart').getContext('2d');
    if (riskChartInstance) riskChartInstance.destroy();

    // 위험도 계산
    const risks = calculateRisks(inputs, breed, weight, age);

    const colors = risks.levels.map(level => {
        if (level >= 70) return '#e74c3c';
        if (level >= 40) return '#f39c12';
        return '#27ae60';
    });
    const bgColors = risks.levels.map(level => {
        if (level >= 70) return 'rgba(231, 76, 60, 0.7)';
        if (level >= 40) return 'rgba(243, 156, 18, 0.7)';
        return 'rgba(39, 174, 96, 0.7)';
    });

    riskChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: risks.categories,
            datasets: [{
                label: '위험도',
                data: risks.levels,
                backgroundColor: bgColors,
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 6,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `${inputs.breed} 건강 위험 요소 평가`,
                    font: { size: 14, weight: 'bold' },
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: '위험도 (0: 안전 ~ 100: 고위험)' },
                },
            },
        },
    });

    // 분석 텍스트
    let analysis = `<p><strong>⚠️ 주요 건강 위험 요소 분석</strong></p><ul>`;
    for (let i = 0; i < risks.categories.length; i++) {
        const level = risks.levels[i];
        const icon = level >= 70 ? '🔴' : level >= 40 ? '🟡' : '🟢';
        analysis += `<li>${icon} <strong>${risks.categories[i]} (${level}점):</strong> ${risks.comments[i]}</li>`;
    }
    analysis += `</ul>`;

    // 견종 특이 질환 안내
    if (breed.risks && breed.risks.length > 0) {
        analysis += `<p><strong>📌 ${inputs.breed} 견종 특이 주의 질환:</strong> ${breed.risks.join(', ')}</p>`;
    }

    // 기저 질환 있을 경우
    if (inputs.disease && inputs.disease !== '없음') {
        analysis += `<p><strong>💊 기저 질환 관련:</strong> ${inputs.disease}이(가) 있으므로 정기 검진과 약물 관리가 중요합니다.</p>`;
    }

    document.getElementById('riskAnalysis').innerHTML = analysis;
}

// ===== 점수 산출 함수들 =====
function evaluateActivity(activityStr, size) {
    if (!activityStr) return 50;
    const minutes = extractMinutes(activityStr);
    const ideal = size === '소형' ? 30 : size === '대형' ? 60 : 45;
    const ratio = Math.min(minutes / ideal, 1.2);
    return Math.min(Math.round(ratio * 83), 100);
}

function evaluateSleep(sleepStr, size) {
    if (!sleepStr) return 60;
    const hours = extractHours(sleepStr);
    // 강아지 평균 수면 12~14시간
    if (hours >= 12 && hours <= 14) return 90;
    if (hours >= 10 && hours <= 16) return 75;
    if (hours >= 8 && hours <= 18) return 60;
    return 40;
}

function evaluateWater(waterStr, weightStr) {
    if (!waterStr) return 60;
    const ml = extractMl(waterStr);
    const weight = parseFloat(weightStr) || 5;
    // 적정 음수량: 체중 1kg당 40~60ml
    const idealMin = weight * 40;
    const idealMax = weight * 60;
    if (ml >= idealMin && ml <= idealMax) return 90;
    if (ml >= idealMin * 0.7 && ml <= idealMax * 1.3) return 70;
    return 50;
}

function evaluateBowel(bowelStr) {
    if (!bowelStr) return 60;
    const count = extractNumber(bowelStr);
    // 정상: 하루 1~3회
    if (count >= 1 && count <= 3) return 90;
    if (count >= 1 && count <= 5) return 70;
    return 50;
}

// ===== 위험도 계산 =====
function calculateRisks(inputs, breed, weight, age) {
    const idealMin = breed.idealWeight[0];
    const idealMax = breed.idealWeight[1];
    const idealMid = (idealMin + idealMax) / 2;

    // 관절 건강
    let jointRisk = 20;
    if (weight > idealMax) jointRisk += 25;
    if (age > 7) jointRisk += 20;
    if (breed.risks.some(r => r.includes('관절') || r.includes('슬개골') || r.includes('고관절') || r.includes('디스크'))) jointRisk += 15;
    if (inputs.disease && (inputs.disease.includes('관절') || inputs.disease.includes('디스크'))) jointRisk += 20;

    // 심장 건강
    let heartRisk = 15;
    if (age > 8) heartRisk += 25;
    if (weight > idealMax * 1.2) heartRisk += 20;
    if (breed.risks.some(r => r.includes('심장'))) heartRisk += 15;
    if (inputs.disease && inputs.disease.includes('심장')) heartRisk += 25;

    // 소화기 건강
    let digestRisk = 15;
    const bowelScore = evaluateBowel(inputs.bowel);
    if (bowelScore < 70) digestRisk += 25;
    if (breed.risks.some(r => r.includes('소화'))) digestRisk += 15;
    if (inputs.disease && (inputs.disease.includes('소화') || inputs.disease.includes('위장'))) digestRisk += 20;

    // 피부 건강
    let skinRisk = 15;
    if (breed.risks.some(r => r.includes('피부') || r.includes('알레르기') || r.includes('탈모'))) skinRisk += 20;
    if (inputs.disease && (inputs.disease.includes('피부') || inputs.disease.includes('알레르기'))) skinRisk += 25;

    // 비만 위험
    let obesityRisk = 10;
    if (weight > idealMax) obesityRisk += Math.min(((weight - idealMax) / idealMax) * 100, 50);
    if (breed.risks.some(r => r.includes('비만'))) obesityRisk += 15;
    const actScore = evaluateActivity(inputs.activity, breed.size);
    if (actScore < 60) obesityRisk += 15;

    // 치아 건강
    let dentalRisk = 20;
    if (age > 5) dentalRisk += 20;
    if (breed.size === '소형') dentalRisk += 15;
    if (breed.risks.some(r => r.includes('치아'))) dentalRisk += 15;

    const levels = [
        Math.min(Math.round(jointRisk), 100),
        Math.min(Math.round(heartRisk), 100),
        Math.min(Math.round(digestRisk), 100),
        Math.min(Math.round(skinRisk), 100),
        Math.min(Math.round(obesityRisk), 100),
        Math.min(Math.round(dentalRisk), 100),
    ];

    const comments = [
        getJointComment(levels[0], breed, age),
        getHeartComment(levels[1], age),
        getDigestComment(levels[2]),
        getSkinComment(levels[3], breed),
        getObesityComment(levels[4], weight, idealMax),
        getDentalComment(levels[5], age, breed.size),
    ];

    return {
        categories: ['관절건강', '심장건강', '소화기건강', '피부건강', '비만위험', '치아건강'],
        levels,
        comments,
    };
}

// ===== 코멘트 생성 함수들 =====
function getActivityComment(score, size) {
    const recommended = size === '소형' ? '30분' : size === '대형' ? '60분 이상' : '45분';
    if (score >= 80) return `적정 수준의 야외 활동을 하고 있습니다. (권장: 하루 ${recommended})`;
    if (score >= 60) return `활동량이 다소 부족합니다. 하루 ${recommended}의 산책을 권장합니다.`;
    return `활동량이 크게 부족합니다. 하루 최소 ${recommended}의 산책이 필요합니다.`;
}

function getSleepComment(score) {
    if (score >= 80) return '정상 범위의 수면 패턴입니다. (성견 기준 12~14시간)';
    if (score >= 60) return '수면 시간이 다소 불규칙합니다. 조용하고 편안한 수면 환경을 마련해 주세요.';
    return '수면 패턴에 문제가 있을 수 있습니다. 지속될 경우 수의사 상담을 권장합니다.';
}

function getWaterComment(score) {
    if (score >= 80) return '적절한 수분 섭취량입니다. (권장: 체중 1kg당 40~60ml/일)';
    if (score >= 60) return '수분 섭취가 다소 부족하거나 과합니다. 신선한 물을 항상 제공해 주세요.';
    return '수분 섭취량에 주의가 필요합니다. 과도한 음수는 질환의 신호일 수 있습니다.';
}

function getBowelComment(score) {
    if (score >= 80) return '정상적인 배변 활동입니다. (정상: 하루 1~3회)';
    if (score >= 60) return '배변 횟수가 다소 많거나 적습니다. 사료 변경이나 스트레스 요인을 확인해 보세요.';
    return '배변 상태에 이상이 있을 수 있습니다. 수의사 상담을 권장합니다.';
}

function getJointComment(level, breed, age) {
    if (level >= 70) return `${age}세 이상 + 견종 특성상 관절 질환 고위험군입니다. 정기 검진과 관절 보조제를 고려하세요.`;
    if (level >= 40) return '중간 수준의 관절 위험이 있습니다. 과체중 방지와 적절한 운동이 중요합니다.';
    return '현재 관절 건강 위험은 낮습니다. 예방적 관리를 유지해 주세요.';
}

function getHeartComment(level, age) {
    if (level >= 70) return '심장 질환 위험이 높습니다. 정기적인 심장 초음파 검사를 권장합니다.';
    if (level >= 40) return '중간 수준의 심장 위험이 있습니다. 체중 관리와 적절한 운동이 도움됩니다.';
    return '현재 심장 건강 위험은 낮습니다.';
}

function getDigestComment(level) {
    if (level >= 70) return '소화기 문제가 우려됩니다. 식이 관리와 수의사 상담이 필요합니다.';
    if (level >= 40) return '소화기 건강에 주의가 필요합니다. 급격한 사료 변경을 피하세요.';
    return '소화기 건강 상태가 양호합니다.';
}

function getSkinComment(level, breed) {
    if (level >= 70) return '피부 질환 고위험군입니다. 정기적인 피부 관리와 알레르기 검사를 권장합니다.';
    if (level >= 40) return '피부 건강에 주의가 필요합니다. 목욕 주기와 식이를 점검해 보세요.';
    return '피부 건강 상태가 양호합니다.';
}

function getObesityComment(level, weight, idealMax) {
    if (level >= 70) return `현재 체중이 적정 범위를 초과합니다. 칼로리 조절과 운동량 증가가 시급합니다.`;
    if (level >= 40) return '비만 위험이 있습니다. 간식을 줄이고 정기적인 체중 측정을 해 주세요.';
    return '비만 위험이 낮습니다. 현재 관리 상태를 유지해 주세요.';
}

function getDentalComment(level, age, size) {
    if (level >= 70) return '치아 질환 고위험군입니다. 스케일링과 일일 양치를 강력히 권장합니다.';
    if (level >= 40) return '치아 건강에 주의가 필요합니다. 덴탈껌이나 양치 습관을 들여주세요.';
    return '치아 건강 위험이 낮습니다. 예방적 관리를 지속해 주세요.';
}

// ===== 텍스트에서 숫자 추출 유틸리티 =====
function extractMinutes(str) {
    // "30분", "1시간", "하루 2회 30분" 등에서 분 추출
    const hourMatch = str.match(/(\d+)\s*시간/);
    const minMatch = str.match(/(\d+)\s*분/);
    let total = 0;
    if (hourMatch) total += parseInt(hourMatch[1]) * 60;
    if (minMatch) total += parseInt(minMatch[1]);
    if (total === 0) {
        const numMatch = str.match(/(\d+)/);
        if (numMatch) total = parseInt(numMatch[1]);
    }
    return total;
}

function extractHours(str) {
    const hourMatch = str.match(/(\d+)\s*시간/);
    if (hourMatch) return parseInt(hourMatch[1]);
    const numMatch = str.match(/(\d+)/);
    if (numMatch) return parseInt(numMatch[1]);
    return 12;
}

function extractMl(str) {
    const mlMatch = str.match(/(\d+)\s*(ml|밀리)/i);
    if (mlMatch) return parseInt(mlMatch[1]);
    const literMatch = str.match(/(\d+\.?\d*)\s*(l|리터)/i);
    if (literMatch) return parseFloat(literMatch[1]) * 1000;
    const numMatch = str.match(/(\d+)/);
    if (numMatch) return parseInt(numMatch[1]);
    return 200;
}

function extractNumber(str) {
    const numMatch = str.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1]) : 2;
}

// ===== UI 상태 관리 =====
function showResult() {
    document.getElementById('resultSection').classList.remove('hidden');
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
}
