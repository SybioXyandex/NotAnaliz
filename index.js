/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from "@google/genai";
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// --- ICONS ---
const icons = {
    analysis: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>`,
    upload: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>`,
    students: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663l.005-.004c.285.45.623.85.994 1.206a9.337 9.337 0 01-4.121.952z" /></svg>`,
    history: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>`,
    results: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h.01M15 12h.01M10.5 16.5h3m-3.75-3.75h.01M13.5 16.5h.01M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg>`,
    back: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>`,
    home: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>`,
    word: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>`,
};

// --- SUBJECT WEIGHTS for AVERAGE CALCULATION ---
const subjectWeights = {
    'BEDEN EĞİTİMİ VE SPOR': 2,
    'BİLİŞİM TEKNOLOJİLERİ VE YAZILIM': 2,
    'DİN KÜLTÜRÜ VE AHLAK BİLGİSİ': 2,
    'FEN BİLİMLERİ': 4,
    'GÖRSEL SANATLAR': 1,
    'MATEMATİK': 5,
    'MÜZİK': 1,
    'SOSYAL BİLGİLER': 3,
    'TÜRKÇE': 6,
    'YABANCI DİL': 3
};

// --- STATE MANAGEMENT ---
const appState = {
  currentView: 'login',
  user: null,
  authView: 'login',
  authError: null,
  userRole: 'none',
  dashboardView: 'analysis',
  studentDashboardView: 'results',
  isLoading: false,
  analysisResult: '',
  studentAnalysisResult: '',
  uploadedData: null,
  uploadedFileName: '',
  dataForAnalysis: '',
  analysisHistory: [],
  viewingHistoryItemId: null,
  selectedStudentName: null,
  selectedSubjectName: null,
  teacherNote: '',
  isNoteLoading: false,
  dbError: null,
};

// --- DOM ELEMENTS ---
const root = document.getElementById('root');
if (!root) throw new Error("Root element not found");

// --- API CLIENTS SETUP ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

// --- SUPABASE SETUP ---
let supabase = null;
const SUPABASE_URL = 'https://aymwskxrupdqpdkuhupw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bXdza3hydXBkcXBka3VodXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0ODg3NTgsImV4cCI6MjA3NDA2NDc1OH0.XUeKyE9bQcebLjSi4tITHEwLMRIsTG14ENia0kEZJ0w';

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn("Supabase URL or Anon Key not provided. Database features will be disabled.");
}

// --- DATA PARSERS ---
async function getStudentData() {
    appState.dbError = null;
    if (!supabase) {
        throw new Error("Supabase is not initialized.");
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
         return { headers: [], scoreHeaders: [], studentList: [], subjectAverages: {} };
    }

    try {
        const userRole = user.user_metadata?.role;
        let query = supabase
            .from('exam_results')
            .select('student_no, student_name, subject, score');
        
        if (userRole === 'teacher') {
            query = query.eq('teacher_id', user.id);
        } else if (userRole === 'student') {
            const studentNumber = user.user_metadata?.student_number;
            if (!studentNumber) {
                return { headers: [], scoreHeaders: [], studentList: [], subjectAverages: {} }; // Student without number can't have results
            }
            query = query.eq('student_no', studentNumber);
        } else {
             return { headers: [], scoreHeaders: [], studentList: [], subjectAverages: {} }; // No role or unknown role
        }

        const { data: results, error } = await query;

        if (error) throw error;
        if (!results || results.length === 0) {
            return { headers: [], scoreHeaders: [], studentList: [], subjectAverages: {} };
        }

        const studentsMap = new Map();
        const subjectSet = new Set();

        for (const row of results) {
            subjectSet.add(row.subject);
            if (!studentsMap.has(row.student_no)) {
                studentsMap.set(row.student_no, {
                    student_no: row.student_no,
                    name: row.student_name,
                    scores: {}
                });
            }
            studentsMap.get(row.student_no).scores[row.subject] = row.score;
        }

        const scoreHeaders = Array.from(subjectSet).sort();
        const headers = ['Öğrenci No', 'Öğrenci', ...scoreHeaders];

        const studentList = Array.from(studentsMap.values()).map(student => {
            let weightedTotal = 0;
            let totalWeight = 0;

            scoreHeaders.forEach(header => {
                const score = student.scores[header];
                const weight = subjectWeights[header];
                if (typeof score === 'number' && typeof weight === 'number' && !isNaN(score)) {
                    weightedTotal += score * weight;
                    totalWeight += weight;
                }
            });

            const average = totalWeight > 0 ? parseFloat((weightedTotal / totalWeight).toFixed(2)) : 0;

            const studentData = {
                student_no: student.student_no,
                name: student.name,
                average: average
            };

            scoreHeaders.forEach(header => {
                studentData[header] = student.scores[header] ?? 'N/A';
            });
            return studentData;
        });


        const subjectAverages = {};
        scoreHeaders.forEach(header => {
            let total = 0;
            let count = 0;
            studentList.forEach(student => {
                const score = student[header];
                if (typeof score === 'number' && !isNaN(score)) {
                    total += score;
                    count++;
                }
            });
            subjectAverages[header] = count > 0 ? parseFloat((total / count).toFixed(2)) : 0;
        });

        return { headers, scoreHeaders, studentList, subjectAverages };

    } catch (error) {
        console.error("Error fetching student data:", error.message || error);
        appState.dbError = getDbErrorInstructions(error);
        throw error; // Re-throw to be caught by the caller
    }
}

async function getStudentSubjectHistory(studentNo, subject) {
    if (!supabase) throw new Error("Supabase is not initialized.");
    const { data, error } = await supabase
        .from('exam_results')
        .select('score, created_at')
        .eq('student_no', studentNo)
        .eq('subject', subject)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

// --- UTILITY FUNCTIONS ---
function formatMarkdown(text) {
    if (!text) return '';
    let formatted = text
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // Process unordered lists
    const listRegex = /(?:^\* .*(?:\r\n|\n|$))+/gm;
    formatted = formatted.replace(listRegex, (listBlock) => {
        const items = listBlock.trim().split(/\r\n|\n/)
            .map(item => item.replace(/^\* /, '').trim())
            .filter(item => item)
            .map(item => `<li>${item}</li>`).join('');
        return `<ul>${items}</ul>`;
    });
    
    return formatted;
}

function handleDownloadWord(elementId, fileName, buttonId) {
    const downloadButton = document.getElementById(buttonId);
    if (!downloadButton) return;

    const originalHTML = downloadButton.innerHTML;
    downloadButton.innerHTML = `Oluşturuluyor...`;
    downloadButton.disabled = true;

    try {
        const element = document.getElementById(elementId);
        if (!element) {
            alert('İndirilecek içerik bulunamadı.');
            return;
        }

        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
                     "xmlns:w='urn:schemas-microsoft-com:office:word' "+
                     "xmlns='http://www.w3.org/TR/REC-html40'>"+
                     "<head><meta charset='utf-8'><title>Export</title></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + element.innerHTML + footer;

        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = fileName;
        fileDownload.click();
        document.body.removeChild(fileDownload);

    } catch (error) {
        console.error("Word generation failed:", error);
        alert("Word dosyası oluşturulurken bir hata oluştu.");
    } finally {
        downloadButton.innerHTML = originalHTML;
        downloadButton.disabled = false;
    }
}


// --- CHART INSTANCE ---
let chartInstance = null;

// --- RENDER FUNCTIONS ---
function renderScoreChart(student, scoreHeaders) {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    const canvas = document.getElementById('scoreChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const scores = scoreHeaders.map(header => student[header] || 0);
    const studentName = student['name'] || 'Öğrenci';

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: scoreHeaders,
            datasets: [{
                label: 'Puan',
                data: scores,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1,
                borderRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Puan' }
                }
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `${studentName} - Ders Puanları`,
                    font: { size: 16, family: "'Poppins', sans-serif" },
                    color: '#333'
                }
            }
        }
    });
}

function renderSubjectHistoryChart(historyData, subjectName) {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    const canvas = document.getElementById('subjectHistoryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = historyData.map(item => new Date(item.created_at).toLocaleDateString('tr-TR'));
    const scores = historyData.map(item => item.score);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Puan',
                data: scores,
                borderColor: context => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                    gradient.addColorStop(0, 'rgba(106, 17, 203, 1)');
                    gradient.addColorStop(1, 'rgba(37, 117, 252, 1)');
                    return gradient;
                },
                backgroundColor: context => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(37, 117, 252, 0)');
                    gradient.addColorStop(1, 'rgba(106, 17, 203, 0.4)');
                    return gradient;
                },
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: context => {
                     const chart = context.chart;
                     const { ctx, chartArea } = chart;
                     if (!chartArea) return 'rgba(106, 17, 203, 1)';
                     const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                     gradient.addColorStop(0, 'rgba(106, 17, 203, 1)');
                     gradient.addColorStop(1, 'rgba(37, 117, 252, 1)');
                     return gradient;
                },
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.4,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Puan' }
                },
                x: {
                     title: { display: true, text: 'Tarih' }
                }
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `${subjectName} Dersi Not Geçmişi`,
                    font: { size: 18, family: "'Poppins', sans-serif", weight: '600' },
                    color: '#333',
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` Puan: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

function renderLogin() {
    const isLoginView = appState.authView === 'login';
    root.innerHTML = `
        <div class="login-screen-background"></div>
        <div class="container login-container">
            <h1>NotAnaliz</h1>
            <div class="auth-toggle">
                <button id="auth-toggle-login" class="auth-toggle-btn ${isLoginView ? 'active' : ''}">Giriş Yap</button>
                <button id="auth-toggle-register" class="auth-toggle-btn ${!isLoginView ? 'active' : ''}">Kayıt Ol</button>
            </div>

            <!-- Login Form -->
            <form id="login-form" class="auth-form" style="display: ${isLoginView ? 'block' : 'none'};">
                <div class="form-group">
                    <label for="login-email">E-posta</label>
                    <input type="email" id="login-email" required autocomplete="email">
                </div>
                <div class="form-group">
                    <label for="login-password">Şifre</label>
                    <input type="password" id="login-password" required autocomplete="current-password">
                </div>
                <button type="submit" class="btn">Giriş Yap</button>
            </form>

            <!-- Register Form -->
            <form id="register-form" class="auth-form" style="display: ${!isLoginView ? 'block' : 'none'};">
                 <div class="form-group">
                    <label for="register-name">Ad Soyad</label>
                    <input type="text" id="register-name" required autocomplete="name">
                </div>
                <div class="form-group">
                    <label for="register-email">E-posta</label>
                    <input type="email" id="register-email" required autocomplete="email">
                </div>
                <div class="form-group">
                    <label for="register-password">Şifre</label>
                    <input type="password" id="register-password" required autocomplete="new-password">
                </div>
                <div class="form-group">
                    <label for="register-role">Rolünüz</label>
                    <select id="register-role" required>
                        <option value="teacher">Öğretmen</option>
                        <option value="student">Öğrenci</option>
                    </select>
                </div>
                <div class="form-group" id="student-number-group" style="display: none;">
                    <label for="register-student-number">Öğrenci Numarası</label>
                    <input type="text" id="register-student-number" autocomplete="off" disabled>
                </div>
                <button type="submit" class="btn">Kayıt Ol</button>
            </form>
            <div id="auth-error-container" class="error-message" style="display: none; margin-top: 1rem;"></div>
        </div>
    `;

    document.getElementById('auth-toggle-login')?.addEventListener('click', () => {
        appState.authView = 'login';
        appState.authError = null;
        render();
    });
    document.getElementById('auth-toggle-register')?.addEventListener('click', () => {
        appState.authView = 'register';
        appState.authError = null;
        render();
    });

    document.getElementById('login-form')?.addEventListener('submit', handleLoginSubmit);
    document.getElementById('register-form')?.addEventListener('submit', handleRegisterSubmit);

    document.getElementById('register-role')?.addEventListener('change', (e) => {
        const role = e.target.value;
        const studentNumberGroup = document.getElementById('student-number-group');
        const studentNumberInput = document.getElementById('register-student-number');
        if (studentNumberGroup && studentNumberInput) {
            if (role === 'student') {
                studentNumberGroup.style.display = 'block';
                studentNumberInput.required = true;
                studentNumberInput.disabled = false;
            } else {
                studentNumberGroup.style.display = 'none';
                studentNumberInput.required = false;
                studentNumberInput.disabled = true;
                studentNumberInput.value = '';
            }
        }
    });
    
    const errorContainer = document.getElementById('auth-error-container');
    if (errorContainer) {
        if (appState.authError) {
            errorContainer.textContent = appState.authError;
            errorContainer.style.display = 'block';
        } else {
            errorContainer.style.display = 'none';
        }
    }
}

function renderStudentListPage(container, studentList) {
     if (studentList.length === 0) {
        container.innerHTML = `
            <div class="card">
                <h3>Öğrenci Listesi</h3>
                <p>Görüntülenecek öğrenci verisi bulunamadı. Lütfen "Sınav Yükle" sekmesinden bir Excel dosyası yükleyin.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = `
        <div class="card">
            <h3>Öğrenci Listesi</h3>
            <ul class="student-list">
                ${studentList.map(student => `
                    <li class="student-list-item">
                        <span><strong>${student.student_no}</strong> - ${student.name}</span>
                        <button class="btn btn-sm" data-student-name="${student.name}">Profili Görüntüle</button>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    document.querySelectorAll('.student-list-item button').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetButton = e.target.closest('button');
            if (targetButton) {
                // Fix: Cast to HTMLButtonElement to access dataset property.
                const studentName = targetButton.dataset.studentName;
                if (studentName) {
                    appState.selectedStudentName = studentName;
                    appState.teacherNote = '';
                    appState.dbError = null;
                    fetchTeacherNote(studentName);
                }
            }
        });
    });
}

async function renderStudentProfilePage(container, studentName, studentData) {
    const { scoreHeaders, studentList, subjectAverages } = studentData;
    const student = studentList.find(s => s.name === studentName);

    if (!student) {
        container.innerHTML = `
            <div class="page-navigation-header">
                <h2>Öğrenci Bulunamadı</h2>
                <div class="page-navigation-actions">
                    <button id="back-to-students" class="btn btn-secondary">${icons.back} Geri Dön</button>
                </div>
            </div>
            <p class="error-message">Öğrenci bulunamadı.</p>
        `;
        document.getElementById('back-to-students')?.addEventListener('click', () => {
            appState.selectedStudentName = null;
            render();
        });
        return;
    }

    // Subject History View
    if (appState.selectedSubjectName) {
        container.innerHTML = `
            <div class="page-navigation-header">
                <h2>${student.name} - ${appState.selectedSubjectName} Ders Not Geçmişi</h2>
                <div class="page-navigation-actions">
                    <button id="back-to-profile" class="btn btn-secondary btn-sm">${icons.back} Öğrenci Profiline Dön</button>
                </div>
            </div>
            <div class="subject-history-view">
                <div class="card chart-card-enhanced">
                    <div class="chart-container" style="height: 500px;" id="subject-history-chart-container">
                        <div class="loader-container"><div class="loader"></div></div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('back-to-profile')?.addEventListener('click', () => {
            appState.selectedSubjectName = null;
            if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
            render();
        });

        const chartContainer = document.getElementById('subject-history-chart-container');
        try {
            const historyData = await getStudentSubjectHistory(student.student_no, appState.selectedSubjectName);
            if(chartContainer) {
                if(historyData && historyData.length > 0) {
                    chartContainer.innerHTML = `<canvas id="subjectHistoryChart"></canvas>`;
                    renderSubjectHistoryChart(historyData, appState.selectedSubjectName);
                } else {
                    chartContainer.innerHTML = '<p>Bu ders için görüntülenecek geçmiş not bulunamadı.</p>';
                }
            }
        } catch (error) {
            console.error("Failed to fetch subject history:", error);
            if(chartContainer) {
                chartContainer.innerHTML = '<p class="error-message">Not geçmişi yüklenirken bir hata oluştu.</p>';
            }
        }
        return;
    }

    // Main Profile View
    const filteredHistory = appState.analysisHistory.filter(item => 
        item.result.includes(studentName) || item.summary.includes(studentName)
    );
    
    const teacherNoteHTML = (() => {
        if (!supabase) return `<p class="error-message">Notlar özelliği için veritabanı bağlantısı gerekli.</p>`;
        if (appState.dbError && appState.dbError.context === 'notes') {
            return appState.dbError.html;
        }
        if (appState.isNoteLoading) {
            return `<div class="loader-container"><div class="loader"></div></div>`;
        }
        return `
            <textarea id="teacher-note-input" placeholder="Bu öğrenci hakkında özel notlarınızı buraya ekleyin...">${appState.teacherNote}</textarea>
            <button id="save-note-btn" class="btn btn-sm">Notu Kaydet</button>
        `;
    })();


    container.innerHTML = `
        <div class="page-navigation-header">
            <h2>${student.name} Öğrenci Profili</h2>
            <div class="page-navigation-actions">
                 <button id="back-to-students" class="btn btn-secondary btn-sm">${icons.back} Öğrenci Listesine Dön</button>
                 <button id="go-home" class="btn btn-sm">${icons.home} Anasayfaya Dön</button>
            </div>
        </div>
        <div class="student-profile-grid">
            <div class="card profile-card">
                <h3>Genel Başarı Ortalaması</h3>
                <p class="average-score">${student.average}</p>
            </div>
            <div class="card profile-card">
                <h3>Ders Notları (Detay için derse tıkla)</h3>
                <ul class="score-list">
                    ${scoreHeaders.map(header => {
                        const score = student[header];
                        const classAverage = subjectAverages ? subjectAverages[header] : 0;
                        let indicator = '';

                        if (typeof score === 'number' && !isNaN(score)) {
                            if (score >= classAverage) {
                                indicator = `<span class="score-indicator up" title="Sınıf ortalamasının üzerinde veya eşit"></span>`;
                            } else {
                                indicator = `<span class="score-indicator down" title="Sınıf ortalamasının altında"></span>`;
                            }
                        }
                        
                        return `
                        <li class="score-list-item">
                            <button class="subject-name-btn" data-subject-name="${header}">${header}</button>
                            <div class="score-display">
                                <span>${student[header] || 'N/A'}</span>
                                ${indicator}
                            </div>
                        </li>`;
                    }).join('')}
                </ul>
            </div>
             <div class="card profile-card">
                <h3>Puan Dağılım Grafiği</h3>
                <div class="chart-container">
                    <canvas id="scoreChart"></canvas>
                </div>
            </div>
            <div class="card profile-card">
                <h3>Öğrenci Hakkında Notlar</h3>
                <div id="teacher-note-container">
                    ${teacherNoteHTML}
                </div>
            </div>
            <div class="card profile-card">
                <h3>İlgili Analiz Geçmişi</h3>
                <div class="analysis-history-scrollable">
                    ${filteredHistory.length > 0 ? `
                        <ul class="history-list">
                            ${filteredHistory.map(item => `
                                <li class="history-item">
                                    <div class="history-item-info">
                                        <strong>Tarih:</strong> ${new Date(item.created_at).toLocaleString()}
                                        <br>
                                        <span>${item.summary}</span>
                                    </div>
                                    <div class="history-item-actions">
                                        <button class="btn btn-sm view-history-btn" data-id="${item.id}">Görüntüle</button>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p>Bu öğrenciyi içeren bir analiz geçmişi bulunamadı.</p>'}
                </div>
            </div>
        </div>
        `;
        
    document.getElementById('back-to-students')?.addEventListener('click', () => {
        appState.selectedStudentName = null;
        appState.selectedSubjectName = null;
        appState.teacherNote = '';
        if (chartInstance) {
            chartInstance.destroy(); chartInstance = null;
        }
        render();
    });

    document.getElementById('go-home')?.addEventListener('click', () => handleMenuViewChange('analysis'));


    if (supabase && (!appState.dbError || appState.dbError.context !== 'notes')) {
        document.getElementById('save-note-btn')?.addEventListener('click', () => handleSaveTeacherNote(studentName));
    }


    document.querySelectorAll('.view-history-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const button = e.target.closest('.view-history-btn');
        if (button) {
            const id = button.dataset.id;
            if(id) {
                appState.dashboardView = 'history';
                appState.viewingHistoryItemId = parseInt(id, 10);
                render();
            }
        }
    }));

    document.querySelectorAll('.subject-name-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetButton = e.target.closest('.subject-name-btn');
            if (targetButton) {
                const subjectName = targetButton.dataset.subjectName;
                if (subjectName) {
                    if (chartInstance) {
                        chartInstance.destroy();
                        chartInstance = null;
                    }
                    appState.selectedSubjectName = subjectName;
                    render();
                }
            }
        });
    });

    renderScoreChart(student, scoreHeaders);
}

async function renderStudentsView(container) {
    container.innerHTML = `<div class="loader-container"><div class="loader"></div></div>`;
    try {
        const studentData = await getStudentData();
        if (appState.selectedStudentName) {
            await renderStudentProfilePage(container, appState.selectedStudentName, studentData);
        } else {
            renderStudentListPage(container, studentData.studentList);
        }
    } catch (error) {
        if (appState.dbError && appState.dbError.context === 'exam_results') {
            container.innerHTML = appState.dbError.html;
        } else {
            container.innerHTML = `<div class="card"><p class="error-message">Öğrenci verileri yüklenirken bir hata oluştu.</p></div>`;
        }
    }
}

function renderDashboard() {
    root.innerHTML = `
        <div class="dashboard-layout">
            <nav class="sidebar">
                <div class="sidebar-header">
                    <h2>NotAnaliz</h2>
                </div>
                <ul class="sidebar-menu">
                    <li><button id="menu-analysis" class="menu-item ${appState.dashboardView === 'analysis' ? 'active' : ''}">${icons.analysis}<span>AI Destekli Analiz</span></button></li>
                    <li><button id="menu-upload" class="menu-item ${appState.dashboardView === 'upload' ? 'active' : ''}">${icons.upload}<span>Sınav Yükle</span></button></li>
                    <li><button id="menu-students" class="menu-item ${appState.dashboardView === 'students' ? 'active' : ''}">${icons.students}<span>Öğrenciler</span></button></li>
                    <li><button id="menu-history" class="menu-item ${appState.dashboardView === 'history' ? 'active' : ''}">${icons.history}<span>Analiz Geçmişi</span></button></li>
                </ul>
                 <button id="logout-btn" class="btn btn-sm logout-btn-sidebar">Çıkış Yap</button>
            </nav>
            <div class="dashboard-content">
                <header class="dashboard-header">
                    <h1>Öğretmen Paneli</h1>
                </header>
                <main id="dashboard-main"></main>
            </div>
        </div>
    `;

    const mainContent = document.getElementById('dashboard-main');
    if (!mainContent) return;

    if (appState.dashboardView === 'analysis') {
        const initialTextareaValue = appState.dataForAnalysis || '';

        mainContent.innerHTML = `
            <div class="card">
                <h3>AI Destekli Analiz</h3>
                <p>Öğrenci sınav verilerini aşağıdaki alana yapıştırın veya "Sınav Yükle" bölümünden aktarın. Analiz, en son yüklenen veriler üzerinden yapılacaktır.</p>
                <textarea id="data-input" placeholder="Veriler 'Sınav Yükle' bölümünden otomatik olarak alınacaktır. İsterseniz buraya manuel olarak da yapıştırabilirsiniz." aria-label="Öğrenci Veri Girişi">${initialTextareaValue}</textarea>
                <button id="analyze-btn" class="btn">Analiz Et</button>
                 <div id="result-container" aria-live="polite"></div>
            </div>
        `;
        
        if (appState.dataForAnalysis) {
            appState.dataForAnalysis = ''; // Clear after use
        }

        const resultContainer = document.getElementById('result-container');
        if(resultContainer) {
            if (appState.isLoading) {
                resultContainer.innerHTML = `<div class="loader-container"><div class="loader" role="status" aria-label="Yükleniyor"></div></div>`;
                document.getElementById('analyze-btn').disabled = true;
            } else if (appState.analysisResult) {
                resultContainer.innerHTML = `
                    <div id="new-analysis-content-to-word" class="analysis-result-box">${formatMarkdown(appState.analysisResult)}</div>
                    <div class="card-footer">
                        <button id="word-download-btn-new-teacher" class="btn">${icons.word}Word Olarak İndir</button>
                    </div>
                `;
                document.getElementById('word-download-btn-new-teacher')?.addEventListener('click', () => 
                    handleDownloadWord('new-analysis-content-to-word', `Yeni_Analiz_Raporu.doc`, 'word-download-btn-new-teacher')
                );
            }
        }
        document.getElementById('analyze-btn')?.addEventListener('click', handleAnalyze);

    } else if (appState.dashboardView === 'upload') {
        let tableHtml = '';
        if (appState.uploadedData) {
            const table = `
                <table>
                    <thead>
                        <tr>
                            ${appState.uploadedData[0].map(headerText => `<th>${headerText}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${appState.uploadedData.slice(1).map(rowData => `
                            <tr>
                                ${rowData.map(cellData => `<td>${cellData}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            tableHtml = `
                <h4>Yüklenen Veri Önizlemesi</h4>
                <div class="data-table-container">${table}</div>
                <button id="save-uploaded-btn" class="btn" ${appState.isLoading ? 'disabled' : ''}>${appState.isLoading ? 'Kaydediliyor...' : 'Bu Veriyi Kaydet ve Öğrencileri Görüntüle'}</button>
            `;
        }

        mainContent.innerHTML = `
            <div class="card">
                <h3>Excel ile Sınav Yükle</h3>
                <p>Sınav sonuçlarını içeren .xlsx veya .xls uzantılı Excel dosyasını seçin. Dosya formatı: İlk sütun 'Öğrenci No', ikinci sütun 'Öğrenci', sonraki sütunlar ders adları olmalıdır.</p>
                <div class="file-upload-wrapper">
                    <input type="file" id="excel-upload" accept=".xlsx, .xls" hidden>
                    <button id="upload-btn" class="btn" ${appState.isLoading ? 'disabled' : ''}>${appState.isLoading ? 'Yükleniyor...' : 'Dosya Seç'}</button>
                    <span id="file-name-display">${appState.uploadedFileName || 'Dosya seçilmedi'}</span>
                </div>
                <div id="data-preview-container">
                    ${(appState.isLoading && !appState.uploadedData) ? '<div class="loader-container"><div class="loader"></div></div>' : tableHtml}
                </div>
            </div>
        `;
        
        if (!appState.isLoading) {
            document.getElementById('upload-btn')?.addEventListener('click', () => {
                document.getElementById('excel-upload')?.click();
            });
            document.getElementById('excel-upload')?.addEventListener('change', handleFileUpload);
            if (appState.uploadedData) {
                 document.getElementById('save-uploaded-btn')?.addEventListener('click', handleSaveUploadedData);
            }
        }
    } else if (appState.dashboardView === 'students') {
        renderStudentsView(mainContent);
    } else if (appState.dashboardView === 'history') {
         mainContent.innerHTML = `
            <div id="history-detail-container"></div>
            <div id="history-list-card" class="card">
                <h3>Analiz Geçmişi</h3>
                ${!supabase ? `<p class="error-message">Analiz geçmişi özelliği için Supabase ayarları eksik.</p>` : ''}
                <div id="history-list-container"></div>
            </div>
        `;

        const listContainer = document.getElementById('history-list-container');
        const detailContainer = document.getElementById('history-detail-container');
        const listCard = document.getElementById('history-list-card');

        if (listContainer && detailContainer && listCard) {
            if (appState.viewingHistoryItemId !== null) {
                listCard.style.display = 'none';
                const item = appState.analysisHistory.find(h => h.id === appState.viewingHistoryItemId);
                if (item) {
                    detailContainer.innerHTML = `
                        <div class="page-navigation-header">
                            <h2>Analiz Detayı</h2>
                            <div class="page-navigation-actions">
                                <button id="back-to-history" class="btn btn-secondary btn-sm">${icons.back} Geçmiş Listesine Dön</button>
                                <button id="go-home" class="btn btn-sm">${icons.home} Anasayfaya Dön</button>
                            </div>
                        </div>
                        <div class="card">
                            <p><strong>Tarih:</strong> ${new Date(item.created_at).toLocaleString()}</p>
                            <div id="analysis-content-to-word" class="analysis-result-box">${formatMarkdown(item.result)}</div>
                            <div class="card-footer">
                                <button id="word-download-btn-teacher" class="btn">${icons.word}Word Olarak İndir</button>
                            </div>
                        </div>`;
                    document.getElementById('back-to-history')?.addEventListener('click', () => {
                        appState.viewingHistoryItemId = null;
                        render();
                    });
                     document.getElementById('go-home')?.addEventListener('click', () => handleMenuViewChange('analysis'));
                     document.getElementById('word-download-btn-teacher')?.addEventListener('click', () => 
                        handleDownloadWord('analysis-content-to-word', `Analiz_Raporu_${item.id}.doc`, 'word-download-btn-teacher')
                     );
                }
            } else {
                listCard.style.display = 'block';
                if (appState.dbError && appState.dbError.context === 'history') {
                    listContainer.innerHTML = appState.dbError.html;
                } else if(appState.isLoading) {
                    listContainer.innerHTML = `<div class="loader-container"><div class="loader"></div></div>`;
                } else if (appState.analysisHistory.length > 0) {
                    listContainer.innerHTML = `
                        <ul class="history-list">
                            ${appState.analysisHistory.map(item => `
                                <li class="history-item">
                                    <div class="history-item-info">
                                        <strong>${new Date(item.created_at).toLocaleString()}</strong>
                                        <br>
                                        <span>${item.summary}</span>
                                    </div>
                                    <div class="history-item-actions">
                                        <button class="btn btn-sm view-history-btn" data-id="${item.id}">Görüntüle</button>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    `;
                } else {
                    listContainer.innerHTML = `<p>Görüntülenecek analiz geçmişi bulunamadı.</p>`;
                }

                listContainer.querySelectorAll('.view-history-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.currentTarget.dataset.id;
                        if (id) {
                            appState.viewingHistoryItemId = parseInt(id, 10);
                            render();
                        }
                    });
                });
            }
        }
    }


    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('menu-analysis')?.addEventListener('click', () => handleMenuViewChange('analysis'));
    document.getElementById('menu-upload')?.addEventListener('click', () => handleMenuViewChange('upload'));
    document.getElementById('menu-students')?.addEventListener('click', () => handleMenuViewChange('students'));
    document.getElementById('menu-history')?.addEventListener('click', () => handleMenuViewChange('history'));
}

async function renderStudentDashboard() {
    const userName = appState.user?.user_metadata?.full_name || 'Öğrenci';
    const studentNumber = appState.user?.user_metadata?.student_number;

    // Render the static layout shell
    root.innerHTML = `
        <div class="dashboard-layout">
            <nav class="sidebar">
                <div class="sidebar-header"><h2>NotAnaliz</h2></div>
                <ul class="sidebar-menu">
                    <li><button id="student-menu-results" class="menu-item ${appState.studentDashboardView === 'results' ? 'active' : ''}">${icons.results}<span>Sonuçlarım</span></button></li>
                    <li><button id="student-menu-analysis" class="menu-item ${appState.studentDashboardView === 'analysis' ? 'active' : ''}">${icons.analysis}<span>Analizim</span></button></li>
                    <li><button id="student-menu-history" class="menu-item ${appState.studentDashboardView === 'history' ? 'active' : ''}">${icons.history}<span>Geçmiş</span></button></li>
                </ul>
                <button id="logout-btn" class="btn btn-sm logout-btn-sidebar">Çıkış Yap</button>
            </nav>
            <div class="dashboard-content">
                 <header class="dashboard-header"><h1>Hoş Geldin, ${userName}</h1></header>
                <main id="student-main-content">
                    <div class="loader-container"><div class="loader"></div></div>
                </main>
            </div>
        </div>
    `;

    const mainContainer = document.getElementById('student-main-content');
    let mainContentHtml = '';

    try {
        switch (appState.studentDashboardView) {
            case 'results':
                if (appState.selectedSubjectName && studentNumber) {
                    // --- Subject Detail View ---
                    mainContentHtml = `
                        <div class="page-navigation-header">
                            <h2>${appState.selectedSubjectName} - Ders Not Geçmişi</h2>
                            <button id="back-to-results" class="btn btn-secondary btn-sm">${icons.back} Geri Dön</button>
                        </div>
                         <div class="subject-history-view">
                            <div class="card chart-card-enhanced">
                                <div class="chart-container" style="height: 500px;" id="chart-render-area">
                                     <div class="loader-container"><div class="loader"></div></div>
                                </div>
                            </div>
                        </div>
                    `;
                    mainContainer.innerHTML = mainContentHtml;
                    
                    const historyData = await getStudentSubjectHistory(studentNumber, appState.selectedSubjectName);
                    const chartRenderArea = document.getElementById('chart-render-area');
                    if (chartRenderArea) {
                        if (historyData && historyData.length > 0) {
                            chartRenderArea.innerHTML = `<canvas id="subjectHistoryChart"></canvas>`;
                            renderSubjectHistoryChart(historyData, appState.selectedSubjectName);
                        } else {
                            chartRenderArea.innerHTML = `<p>Bu ders için görüntülenecek geçmiş not bulunamadı.</p>`;
                        }
                    }
                } else {
                    // --- Results List View ---
                    const { studentList, scoreHeaders, subjectAverages } = await getStudentData();
                    const studentData = studentList.find(s => s.student_no === studentNumber);
                    if (studentData) {
                        mainContentHtml = `
                            <div class="student-profile-grid">
                                <div class="card profile-card">
                                    <h3>Genel Başarı Ortalaması</h3>
                                    <p class="average-score">${studentData.average || 'N/A'}</p>
                                </div>
                                <div class="card">
                                    <h3>Sınav Sonuçların (Detay için derse tıkla)</h3>
                                    <ul class="score-list">
                                        ${scoreHeaders.map(header => {
                                            const score = studentData[header];
                                            const classAverage = subjectAverages ? subjectAverages[header] : 0;
                                            let indicator = '';
                    
                                            if (typeof score === 'number' && !isNaN(score)) {
                                                if (score >= classAverage) {
                                                    indicator = `<span class="score-indicator up" title="Sınıf ortalamasının üzerinde veya eşit"></span>`;
                                                } else {
                                                    indicator = `<span class="score-indicator down" title="Sınıf ortalamasının altında"></span>`;
                                                }
                                            }
                                            
                                            return `
                                            <li class="score-list-item">
                                                <button class="subject-name-btn" data-subject-name="${header}">${header}</button>
                                                <div class="score-display">
                                                    <span>${studentData[header] || 'N/A'}</span>
                                                    ${indicator}
                                                </div>
                                            </li>`;
                                        }).join('')}
                                    </ul>
                                </div>
                                <div class="card profile-card profile-card-full">
                                    <h3>Puan Dağılım Grafiği</h3>
                                    <div class="chart-container">
                                        <canvas id="scoreChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        mainContentHtml = `<div class="card"><p>Sınav sonuçlarınız henüz sisteme yüklenmemiş veya öğrenci numaranızla (${studentNumber || 'Numara Yok'}) eşleşen bir kayıt bulunamadı.</p></div>`;
                    }
                    mainContainer.innerHTML = mainContentHtml;
                    if (studentData) {
                        renderScoreChart(studentData, scoreHeaders);
                    }
                }
                break;
            case 'analysis':
                const { studentList } = await getStudentData();
                const studentData = studentList.find(s => s.student_no === studentNumber);
                let analysisContentHtml = '';
                if (!studentData) {
                    analysisContentHtml = `<p>Performans analizi oluşturmak için öncelikle sınav sonuçlarınızın sisteme yüklenmiş olması gerekmektedir.</p>`;
                } else if (appState.isLoading) {
                    analysisContentHtml = `<div class="loader-container"><div class="loader"></div></div>`;
                } else if (appState.studentAnalysisResult) {
                    analysisContentHtml = `
                        <div id="new-student-analysis-to-word" class="analysis-result-box">${formatMarkdown(appState.studentAnalysisResult)}</div>
                        <div class="card-footer">
                             <button id="word-download-btn-new-student" class="btn">${icons.word}Word Olarak İndir</button>
                        </div>
                    `;
                } else {
                    analysisContentHtml = `
                        <p>Sınav sonuçlarınıza dayalı kişiselleştirilmiş bir performans analizi almak için aşağıdaki butona tıklayın. Bu analiz, güçlü yönlerinizi ve geliştirilebilecek alanlarınızı anlamanıza yardımcı olacaktır.</p>
                        <button id="get-student-analysis-btn" class="btn">Analiz Oluştur</button>
                    `;
                }
                mainContentHtml = `
                    <div class="card">
                        <h3>Kişisel Performans Analizi</h3>
                        <div id="student-analysis-container">${analysisContentHtml}</div>
                    </div>
                `;
                mainContainer.innerHTML = mainContentHtml;
                break;
            case 'history':
                 const historyItem = appState.viewingHistoryItemId !== null 
                    ? appState.analysisHistory.find(h => h.id === appState.viewingHistoryItemId)
                    : null;
        
                if (historyItem) {
                    mainContentHtml = `
                        <div class="page-navigation-header">
                            <h2>Analiz Detayı</h2>
                            <button id="back-to-student-history" class="btn btn-secondary btn-sm">${icons.back} Geçmiş Listesine Dön</button>
                        </div>
                        <div class="card">
                            <p><strong>Tarih:</strong> ${new Date(historyItem.created_at).toLocaleString()}</p>
                            <div id="analysis-content-to-word" class="analysis-result-box">${formatMarkdown(historyItem.result)}</div>
                            <div class="card-footer">
                                <button id="word-download-btn-student" class="btn">${icons.word}Word Olarak İndir</button>
                            </div>
                        </div>`;
                } else {
                    let historyListHtml = '';
                     if (appState.dbError && appState.dbError.context === 'history') {
                        historyListHtml = appState.dbError.html;
                    } else if (appState.isLoading) {
                        historyListHtml = `<div class="loader-container"><div class="loader"></div></div>`;
                    } else if (appState.analysisHistory.length > 0) {
                        historyListHtml = `
                            <ul class="history-list">
                                ${appState.analysisHistory.map(item => `
                                    <li class="history-item">
                                        <div class="history-item-info">
                                            <strong>${new Date(item.created_at).toLocaleString()}</strong>
                                            <br><span>${item.summary}</span>
                                        </div>
                                        <button class="btn btn-sm view-history-btn" data-id="${item.id}">Görüntüle</button>
                                    </li>
                                `).join('')}
                            </ul>`;
                    } else {
                        historyListHtml = `<p>Görüntülenecek analiz geçmişi bulunamadı.</p>`;
                    }
                    mainContentHtml = `
                        <div class="card">
                            <h3>Geçmiş Analizlerin</h3>
                            <div id="student-history-list-container">${historyListHtml}</div>
                        </div>`;
                }
                mainContainer.innerHTML = mainContentHtml;
                break;
        }
    } catch (error) {
        if (appState.dbError && appState.dbError.context === 'exam_results') {
             mainContainer.innerHTML = appState.dbError.html;
        } else {
            mainContainer.innerHTML = `<div class="card"><p class="error-message">Öğrenci verileri yüklenirken bir hata oluştu.</p></div>`;
        }
    }

    // Attach event listeners
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('student-menu-results')?.addEventListener('click', () => handleStudentMenuViewChange('results'));
    document.getElementById('student-menu-analysis')?.addEventListener('click', () => handleStudentMenuViewChange('analysis'));
    document.getElementById('student-menu-history')?.addEventListener('click', () => handleStudentMenuViewChange('history'));

    // View-specific listeners
    if (appState.studentDashboardView === 'results') {
        if (appState.selectedSubjectName) {
            document.getElementById('back-to-results')?.addEventListener('click', () => {
                appState.selectedSubjectName = null;
                if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
                render();
            });
        } else {
            document.querySelectorAll('.subject-name-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const button = e.target.closest('.subject-name-btn');
                    if (button) {
                        const subjectName = button.dataset.subjectName;
                        if (subjectName) {
                            appState.selectedSubjectName = subjectName;
                            render();
                        }
                    }
                });
            });
        }
    } else if (appState.studentDashboardView === 'analysis') {
        document.getElementById('get-student-analysis-btn')?.addEventListener('click', handleStudentAnalysis);
        if (appState.studentAnalysisResult) {
            document.getElementById('word-download-btn-new-student')?.addEventListener('click', () => 
                handleDownloadWord('new-student-analysis-to-word', 'Performans_Analiz_Raporum.doc', 'word-download-btn-new-student')
            );
        }
    } else if (appState.studentDashboardView === 'history') {
        document.getElementById('back-to-student-history')?.addEventListener('click', () => {
            appState.viewingHistoryItemId = null;
            render();
        });
        document.querySelectorAll('#student-history-list-container .view-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.target.closest('.view-history-btn');
                if (button) {
                    const id = button.dataset.id;
                    if (id) {
                        appState.viewingHistoryItemId = parseInt(id, 10);
                        render();
                    }
                }
            });
        });
        if (appState.viewingHistoryItemId !== null) {
            const historyItem = appState.analysisHistory.find(h => h.id === appState.viewingHistoryItemId);
            if (historyItem) {
                document.getElementById('word-download-btn-student')?.addEventListener('click', () => 
                    handleDownloadWord('analysis-content-to-word', `Analiz_Raporu_${historyItem.id}.doc`, 'word-download-btn-student')
                );
            }
        }
    }
}


function render() {
    if (!appState.user && appState.currentView !== 'login') {
        appState.currentView = 'login';
    }

    switch(appState.currentView) {
        case 'login':
            renderLogin();
            break;
        case 'dashboard':
            if (appState.userRole !== 'teacher') {
                handleLogout(); // Prevent unauthorized access
                return;
            }
            renderDashboard();
            break;
        case 'studentDashboard':
            if (appState.userRole !== 'student') {
                handleLogout(); // Prevent unauthorized access
                return;
            }
            renderStudentDashboard();
            break;
    }
}

// --- EVENT HANDLERS & LOGIC ---

async function handleLoginSubmit(e) {
    e.preventDefault();
    if (!supabase) return;
    appState.authError = null;
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        appState.authError = "Giriş yapılamadı: " + error.message;
    }
    render(); // Re-render to show error or trigger auth state change
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    if (!supabase) return;
    appState.authError = null;

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const fullName = document.getElementById('register-name').value;
    const role = document.getElementById('register-role').value;
    const studentNumber = document.getElementById('register-student-number').value;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: role,
                ...(role === 'student' && { student_number: studentNumber })
            }
        }
    });

    if (error) {
        appState.authError = "Kayıt olunamadı: " + error.message;
    } else if (data.user) {
        // Potentially show a "check your email" message if confirmation is required
        alert("Kayıt başarılı! Lütfen giriş yapın.");
        appState.authView = 'login';
    }
    render();
}

async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    appState.user = null;
    appState.userRole = 'none';
    appState.currentView = 'login';
    appState.analysisHistory = [];
    appState.uploadedData = null;
    render();
}

function handleMenuViewChange(view) {
    appState.dashboardView = view;
    appState.analysisResult = '';
    appState.uploadedData = null;
    appState.uploadedFileName = '';
    appState.selectedStudentName = null;
    appState.selectedSubjectName = null;
    appState.viewingHistoryItemId = null;
    appState.dbError = null;

    if (view === 'history') {
        fetchAnalysisHistory();
    } else {
        render();
    }
}

function handleStudentMenuViewChange(view) {
    appState.studentDashboardView = view;
    appState.studentAnalysisResult = '';
    appState.viewingHistoryItemId = null;
    appState.selectedSubjectName = null;
    appState.dbError = null;

    if (view === 'history') {
        fetchAnalysisHistory();
    } else {
        render();
    }
}

async function handleAnalyze() {
    appState.isLoading = true;
    appState.analysisResult = '';
    render();

    try {
        const { studentList, headers, scoreHeaders } = await getStudentData();
        if (studentList.length === 0) {
            appState.analysisResult = "Analiz edilecek veri bulunamadı. Lütfen önce sınav verilerini yükleyin.";
            return;
        }

        const dataString = [
            headers.join('\t'),
            ...studentList.map(s => [
                s.student_no,
                s.name,
                ...scoreHeaders.map(h => s[h] ?? 'N/A')
            ].join('\t'))
        ].join('\n');
        
        const prompt = `
# GÖREV
Sen bir eğitim danışmanısın. Aşağıdaki öğrenci sınav verilerini analiz ederek öğretmen için detaylı bir rapor oluştur.

# VERİ FORMATI
Veriler sekme ile ayrılmış (TSV) formatındadır. İlk satır başlıkları, sonraki satırlar öğrenci verilerini içerir.

# RAPOR GEREKSİNİMLERİ
Raporunu Markdown formatında, aşağıdaki başlıkları kullanarak yapılandır:
**ÖNEMLİ:** Raporunda öğrencilerden bahsederken anonim ifadeler (örneğin, "1. öğrenci") yerine, verideki 'Öğrenci' sütunundan gelen **gerçek adlarını ve soyadlarını** kullan.

## 1. Genel Sınıf Performansı
- Sınıfın genel başarı ortalamasını belirt.
- En başarılı ve en düşük performans gösteren dersleri analiz et.
- Sınıf genelindeki not dağılımı hakkında kısa bir yorum yap.

## 2. Öne Çıkan Öğrenciler
- En yüksek genel ortalamaya sahip ilk 3 öğrenciyi **isimleriyle** listele.
- Belirli derslerde olağanüstü başarı gösteren (örneğin 95 ve üzeri puan alan) öğrencileri **isimleriyle** belirt.

## 3. Destek Gerektiren Öğrenciler
- En düşük genel ortalamaya sahip 3 öğrenciyi **isimleriyle** listele.
- Özellikle birden fazla dersten düşük not alan öğrencilere **isimleriyle** dikkat çek.

## 4. Ders Bazında Analiz
- Her bir ders için sınıf ortalamasını hesapla.
- Her derste en başarılı ve en çok zorlanan öğrencileri **isimleriyle** belirt.
- Dersler arası başarı farklılıklarına dikkat çek.

## 5. Eyleme Yönelik Öneriler
- Sınıf genelindeki başarıyı artırmak için 2-3 somut öneri sun (örneğin, grup çalışmaları, ek kaynaklar).
- Düşük performans gösteren öğrencilere yönelik 2-3 kişiselleştirilmiş destek stratejisi öner.
- Başarılı öğrencileri motive etmek için 1-2 öneri sun.

# ANALİZ EDİLECEK VERİ
${dataString}
`;

        const response = await ai.models.generateContent({ model, contents: prompt });
        appState.analysisResult = response.text;
        
        await saveAnalysisToHistory("Genel Sınıf Analizi", response.text);

    } catch (error) {
        console.error("Analysis failed:", error);
        appState.analysisResult = "Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.";
    } finally {
        appState.isLoading = false;
        render();
    }
}


async function handleStudentAnalysis() {
    appState.isLoading = true;
    appState.studentAnalysisResult = '';
    render();

    try {
        const studentNumber = appState.user?.user_metadata?.student_number;
        const { studentList, scoreHeaders } = await getStudentData();
        const studentData = studentList.find(s => s.student_no === studentNumber);

        if (!studentData) {
            appState.studentAnalysisResult = "Analiz için sınav verileriniz bulunamadı.";
            return;
        }

        const dataString = `Ders, Puan\n` + scoreHeaders.map(h => `${h}, ${studentData[h]}`).join('\n');

        const prompt = `
# GÖREV
Sen bir öğrenci koçusun. Aşağıdaki sınav sonuçlarını analiz ederek öğrenci için kişisel bir performans raporu oluştur.

# RAPOR GEREKSİNİMLERİ
Raporunu Markdown formatında, samimi ve motive edici bir dille, aşağıdaki başlıkları kullanarak yapılandır:

## 1. Genel Başarı Durumun
- Genel not ortalamanı ve bunun ne anlama geldiğini açıkla.
- Genel performansın hakkında olumlu bir yorum yap.

## 2. Güçlü Yönlerin
- En başarılı olduğun 2-3 dersi listele.
- Bu derslerdeki başarının olası nedenlerini (örneğin, konuya ilgi, düzenli çalışma) vurgula.

## 3. Geliştirebileceğin Alanlar
- Diğer derslere göre daha düşük puan aldığın 1-2 dersi belirt.
- Bu derslerdeki performansını nasıl artırabileceğine dair 2-3 somut ve uygulanabilir öneri sun (örneğin, "Bu derste zorlandığın konuları tekrar gözden geçirebilirsin" veya "Anlamadığın yerleri öğretmenine sormaktan çekinme").

## 4. İleriye Yönelik İpuçları
- Başarını sürdürmek ve daha da ileriye taşımak için 1-2 genel çalışma stratejisi öner (örneğin, çalışma planı oluşturma, kısa tekrarlar yapma).
- Motive edici bir kapanış cümlesi ekle.

# ANALİZ EDİLECEK VERİ
${dataString}
`;

        const response = await ai.models.generateContent({ model, contents: prompt });
        appState.studentAnalysisResult = response.text;
        await saveAnalysisToHistory("Kişisel Performans Analizi", response.text);
    } catch (error) {
        console.error("Student analysis failed:", error);
        appState.studentAnalysisResult = "Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.";
    } finally {
        appState.isLoading = false;
        render();
    }
}


async function saveAnalysisToHistory(summary, result) {
    if (!supabase || !appState.user) return;
    try {
        const { error } = await supabase.from('analysis_history').insert({
            summary,
            result,
            user_id: appState.user.id
        });
        if (error) throw error;
    } catch (error) {
        console.error("Failed to save analysis to history:", error);
        // Optionally show a non-blocking error to the user
    }
}

async function fetchAnalysisHistory() {
    appState.isLoading = true;
    appState.dbError = null;
    render();

    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("User not authenticated for fetching history.");
        appState.isLoading = false;
        render();
        return;
    }

    try {
        const { data, error } = await supabase
            .from('analysis_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        appState.analysisHistory = data || [];
    } catch (error) {
        appState.dbError = getDbErrorInstructions(error);
    } finally {
        appState.isLoading = false;
        render();
    }
}

function handleFileUpload(event) {
    const target = event.target;
    if (!target.files || target.files.length === 0) return;
    appState.isLoading = true;
    render();

    const file = target.files[0];
    appState.uploadedFileName = file.name;
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            appState.uploadedData = jsonData.filter(row => row.some(cell => cell !== null && cell !== ''));
        } catch (error) {
            alert("Dosya okunurken bir hata oluştu. Lütfen dosyanın formatını kontrol edin.");
            console.error(error);
            appState.uploadedData = null;
            appState.uploadedFileName = '';
        } finally {
            appState.isLoading = false;
            render();
        }
    };
    reader.onerror = () => {
        alert("Dosya okunamadı.");
        appState.isLoading = false;
        render();
    };
    reader.readAsArrayBuffer(file);
}

async function handleSaveUploadedData() {
    if (!supabase || !appState.user || !appState.uploadedData) return;
    appState.isLoading = true;
    render();

    const headers = appState.uploadedData[0];
    const studentNoHeader = headers[0];
    const studentNameHeader = headers[1];
    const subjectHeaders = headers.slice(2);

    const dataToInsert = [];
    const sessionId = crypto.randomUUID();

    for (let i = 1; i < appState.uploadedData.length; i++) {
        const row = appState.uploadedData[i];
        const studentNo = row[0];
        const studentName = row[1];
        for (let j = 0; j < subjectHeaders.length; j++) {
            const subject = subjectHeaders[j];
            const score = parseInt(row[j + 2], 10);
            if (studentNo && studentName && subject && !isNaN(score)) {
                dataToInsert.push({
                    teacher_id: appState.user.id,
                    upload_session_id: sessionId,
                    student_no: studentNo.toString(),
                    student_name: studentName,
                    subject: subject,
                    score: score,
                });
            }
        }
    }

    try {
        const { error } = await supabase.from('exam_results').insert(dataToInsert);
        if (error) throw error;
        alert("Veriler başarıyla kaydedildi!");
        appState.uploadedData = null;
        appState.uploadedFileName = '';
        handleMenuViewChange('students'); // Switch to students view
    } catch (error) {
        appState.dbError = getDbErrorInstructions(error);
        alert("Veriler kaydedilirken bir hata oluştu: " + error.message);
    } finally {
        appState.isLoading = false;
        render();
    }
}

async function fetchTeacherNote(studentName) {
    if (!supabase || !appState.user) return;
    appState.isNoteLoading = true;
    renderStudentsView(document.getElementById('dashboard-main'));

    try {
        const { data, error } = await supabase
            .from('teacher_notes')
            .select('note')
            .eq('teacher_id', appState.user.id)
            .eq('student_name', studentName)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore "exact one row" error
        appState.teacherNote = data?.note || '';
    } catch (error) {
        appState.dbError = getDbErrorInstructions(error);
    } finally {
        appState.isNoteLoading = false;
        render(); // Re-render the whole dashboard to reflect note
    }
}

async function handleSaveTeacherNote(studentName) {
    if (!supabase || !appState.user) return;
    const noteInput = document.getElementById('teacher-note-input');
    if (!noteInput) return;

    const note = noteInput.value;

    try {
        const { error } = await supabase
            .from('teacher_notes')
            .upsert({
                teacher_id: appState.user.id,
                student_name: studentName,
                note: note
            }, { onConflict: 'teacher_id, student_name' });
        
        if (error) throw error;

        appState.teacherNote = note;
        alert("Not kaydedildi!");
    } catch (error) {
        alert("Not kaydedilirken bir hata oluştu: " + error.message);
    }
}


// --- DATABASE ERROR HANDLING ---
function getDbErrorInstructions(error) {
    const message = (error?.message || '').toLowerCase();
    
    const createTableHTML = (tableName, sql) => `
        <div class="db-error-box">
            <h4>Veritabanı Kurulumu Gerekli</h4>
            <p>Verileri saklamak için '${tableName}' tablosu bulunamadı. Lütfen aşağıdaki adımları izleyerek tabloyu oluşturun:</p>
            <ol>
                <li>Supabase projenizde sol menüden <strong>SQL Editor</strong>'e gidin.</li>
                <li><strong>New query</strong>'e tıklayın ve aşağıdaki kodu yapıştırıp <strong>RUN</strong> butonuna basın.</li>
            </ol>
            <pre class="code-block"><code>${sql.trim()}</code></pre>
            <p>Tabloyu oluşturduktan sonra, bu sayfayı yenileyin veya sekmeyi yeniden açın.</p>
        </div>`;

    const getExamResultsRlsInstructions = () => `
        <div class="db-error-box">
            <h4>Veritabanı İzinleri Güncellenmeli</h4>
            <p>'exam_results' tablosu için hem öğretmenlerin hem de öğrencilerin doğru verilere erişebilmesi için güvenlik kurallarının (RLS) ayarlanması gerekiyor. Lütfen mevcut 'exam_results' politikalarınızı silip aşağıdakileri ekleyin:</p>
            <ol>
                <li>Supabase projenizde sol menüden <strong>Authentication</strong> -> <strong>Policies</strong>'e gidin ve 'exam_results' tablosu için mevcut tüm politikaları silin.</li>
                <li>Sol menüden <strong>SQL Editor</strong>'e gidin ve <strong>New query</strong>'e tıklayın.</li>
                <li>Aşağıdaki SQL kodunu yapıştırıp <strong>RUN</strong> butonuna basın. Bu komutlar, öğretmenlerin veri eklemesine ve hem öğretmenlerin hem de öğrencilerin kendi verilerini görmesine izin veren iki ayrı kural oluşturacaktır.</li>
            </ol>
            
            <h5>Öğretmenler için Veri Ekleme (INSERT) Kuralı:</h5>
            <pre class="code-block"><code>-- 1. Bu kural, sadece kimliği doğrulanmış öğretmenlerin 'exam_results' tablosuna veri eklemesine izin verir.
CREATE POLICY "Enable insert for teachers only"
ON public.exam_results
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher' AND
  auth.uid() = teacher_id
);</code></pre>

            <h5>Öğretmen ve Öğrenciler için Veri Görüntüleme (SELECT) Kuralı:</h5>
            <pre class="code-block"><code>-- 2. Bu kural, öğretmenlerin kendi eklediği tüm öğrencileri, öğrencilerin ise sadece kendi sonuçlarını görmesini sağlar.
CREATE POLICY "Enable select for users based on role"
ON public.exam_results
FOR SELECT
TO authenticated
USING (
  (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher' AND
    auth.uid() = teacher_id
  ) OR (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'student' AND
    (auth.jwt() -> 'user_metadata' ->> 'student_number') = student_no
  )
);</code></pre>
            <p>Bu kuralları ekledikten sonra sayfayı yenileyin.</p>
        </div>`;

    const rlsPolicyHTML = (tableName, operation) => {
        const userIdColumn = tableName === 'teacher_notes' ? 'teacher_id' : 'user_id';
        const operationDisplay = operation.toUpperCase();
        return `
        <div class="db-error-box">
            <h4>Veritabanı İzinleri Gerekli (${operationDisplay})</h4>
            <p>'${tableName}' tablosuna erişim için izinler (RLS Policy) eksik. Lütfen SQL Editor kullanarak aşağıdaki gibi bir kural oluşturun:</p>
            <pre class="code-block"><code>CREATE POLICY "Enable ${operation} for own data"
ON public.${tableName}
FOR ${operationDisplay}
TO authenticated
USING (auth.uid() = ${userIdColumn})
${operation === 'insert' || operation === 'update' ? `WITH CHECK (auth.uid() = ${userIdColumn})` : ''};</code></pre>
            <p>Her bir işlem (SELECT, INSERT, UPDATE, DELETE) için ayrı bir kural oluşturmanız gerekebilir.</p>
        </div>`;
    }

    if (message.includes('exam_results')) {
        if (message.includes('schema cache') || message.includes('does not exist')) {
            return { context: 'exam_results', html: createTableHTML('exam_results', `CREATE TABLE public.exam_results (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  teacher_id UUID DEFAULT auth.uid() NOT NULL,
  upload_session_id UUID NOT NULL,
  student_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  score INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT exam_results_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);`) };
        }
        if (message.includes('violates row-level security policy')) {
            return { context: 'exam_results', html: getExamResultsRlsInstructions() };
        }
    }


    if (message.includes('analysis_history')) {
        if (message.includes('schema cache') || message.includes('does not exist')) {
            return { context: 'history', html: createTableHTML('analysis_history', `CREATE TABLE public.analysis_history (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID DEFAULT auth.uid() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  summary TEXT,
  result TEXT,
  CONSTRAINT analysis_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);`) };
        }
        if (message.includes('violates row-level security policy')) {
            let op = 'select';
            if(message.includes('insert')) op = 'insert';
            if(message.includes('delete')) op = 'delete';
            return { context: 'history', html: rlsPolicyHTML('analysis_history', op) };
        }
    }

    if (message.includes('teacher_notes')) {
        if (message.includes('schema cache') || message.includes('does not exist')) {
            return { context: 'notes', html: createTableHTML('teacher_notes', `CREATE TABLE public.teacher_notes (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  teacher_id UUID DEFAULT auth.uid() NOT NULL,
  student_name TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(teacher_id, student_name),
  CONSTRAINT teacher_notes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);`) };
        }
        if (message.includes('violates row-level security policy')) {
            let op = 'select';
            if(message.includes('insert')) op = 'insert';
            if(message.includes('update')) op = 'update';
            return { context: 'notes', html: rlsPolicyHTML('teacher_notes', op) };
        }
    }

    return { context: 'unknown', html: `<div class="error-message">Beklenmeyen bir veritabanı hatası oluştu: ${error.message}</div>` };
}

// --- INITIALIZATION ---
function init() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }

    if (!supabase) {
        root.innerHTML = `<div class="error-message">Uygulama başlatılamadı: Supabase istemcisi yapılandırılamadı.</div>`;
        return;
    }

    supabase.auth.onAuthStateChange((event, session) => {
        const user = session?.user || null;
        appState.user = user;
        if (user) {
            const role = user.user_metadata?.role;
            if (role === 'teacher') {
                appState.userRole = 'teacher';
                appState.currentView = 'dashboard';
            } else if (role === 'student') {
                appState.userRole = 'student';
                appState.currentView = 'studentDashboard';
            } else {
                // No role, default to login
                appState.currentView = 'login';
                appState.userRole = 'none';
            }
        } else {
            appState.userRole = 'none';
            appState.currentView = 'login';
        }
        render();
    });
}

init();
