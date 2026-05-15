# 🏟️ 체육시설 통합 매뉴얼 시스템

> 청주시 산하 5개 공공 체육시설을 위한 통합 운영 매뉴얼 웹 시스템

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-배포중-brightgreen)
![HTML5](https://img.shields.io/badge/HTML5-정적사이트-orange)
![License](https://img.shields.io/badge/License-내부용-lightgrey)

---

## 📌 프로젝트 소개

공공 체육시설 담당자 및 운영 직원이 **시설 운영에 필요한 모든 정보를 한 곳에서 확인**할 수 있도록 구축된 내부 통합 매뉴얼 웹 시스템입니다.

기존 **GitLab Pages** 기반으로 운영되던 프로젝트를 **GitHub Pages** 환경으로 완전히 이관하면서, 폴더 구조 및 배포 방식도 함께 표준화하였습니다.

---

## 🏢 대상 시설

| 시설명 | 분류 |
|---|---|
| 청주수영장 | 수영 시설 |
| 푸르미스포츠센터 | 종합 체육 시설 |
| 영운국민체육센터 | 국민 체육 시설 |
| 복대국민체육센터 | 국민 체육 시설 |
| 가경국민체육센터 | 국민 체육 시설 |

---

## 🗂️ 프로젝트 구조

```
manual-8/
│
├── index.html              # 메인 진입점 (PC용)
├── index_renewal4.html     # 갱신 버전 메인
│
├── assets/                 # 정적 자원 (CSS, JS, 이미지, 아이콘)
│   ├── css/                # 스타일시트
│   ├── js/                 # 자바스크립트 (js + javaScript 통합)
│   ├── images/
│   │   ├── manual/         # 매뉴얼 관련 이미지
│   │   └── sports/         # 체육시설 관련 이미지
│   └── icons/              # 아이콘 파일
│
├── pages/                  # 핵심 서비스 서브페이지
│   ├── guide/              # 시설별 안내 페이지
│   ├── facility_status/    # 시설 현황
│   ├── helpdesk/           # 헬프데스크 (수정/개선 요청)
│   ├── gagyeong_sportscenter/ # 가경국민체육센터 전용
│   ├── updatecontainer/    # 업데이트 현황
│   └── voc/                # VOC (고객의 소리)
│
├── docs/                   # 프로젝트 문서
│   ├── REFACTORING_PLAN.md # 구조 개편 계획서
│   ├── TASK.md             # 작업 진행 체크리스트
│   └── *.pdf               # 참고 문서 (안전관리 표준매뉴얼 등)
│
├── versions/               # 구버전 보관소 (히스토리용)
├── _unclassified/          # 분류 대기 파일
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Actions 자동 배포 스크립트
```

---

## ⚙️ 주요 기능

| 메뉴 | 설명 |
|---|---|
| **업데이트 현황** | 시스템 업데이트 이력 및 변경 사항 확인 |
| **시설현황** | 5개 체육시설의 현황 정보 |
| **시설안내** | 시설별 운영 가이드 (PC / 모바일 반응형 지원) |
| **매뉴얼** | 행정·기술·체육 분야 운영 매뉴얼 |
| **VOC** | 수영장·다목적체육관·프로그램실 등 고객의 소리 |
| **Help** | 수정 및 개선 요청 (Google Sheets 연동) |

---

## 🚀 배포

- **플랫폼:** GitHub Pages
- **배포 방식:** GitHub Actions 자동 배포 (`.github/workflows/deploy.yml`)
- **트리거:** `main` 브랜치 push 시 자동 배포
- **최적화:** 대용량 이미지 자동 압축 (JPG 800KB↑, PNG 1MB↑)

---

## 📋 이관 이력

| 구분 | 내용 |
|---|---|
| **이전 플랫폼** | GitLab Pages (`manual-5d03dc.gitlab.io`) |
| **현재 플랫폼** | GitHub Pages |
| **이관 작업** | `public/` 종속 구조 해체 → `assets/`, `pages/` 표준 구조로 개편 |

---

## 👤 관리자 정보

- **담당자:** 박영규
- **문의:** [헬프데스크](https://docs.google.com/spreadsheets/d/1gkFP9ARlFcD6uUwKhKYZTIWMENFj7Hs1k6FgW8fN1uA/edit?usp=sharing) 를 통해 수정 및 개선 요청 가능
