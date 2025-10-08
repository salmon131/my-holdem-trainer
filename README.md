# 🃏 Holdem Chart Trainer

포커 차트 암기와 기본기 연습을 위한 웹 애플리케이션입니다.

🌐 **라이브 데모**: [https://my-holdem-trainer.vercel.app/](https://my-holdem-trainer.vercel.app/)

## ✨ 주요 기능

- **📊 포지션별 차트**: UTG, MP, CO, BTN, SB, BB 포지션별 시작 핸드 차트
- **🃏 커뮤니티 카드 학습**: 5장의 커뮤니티 카드로부터 각 족보별 가능한 핸드 분석
- **🎨 직관적 UI**: Tailwind CSS로 구현된 모던한 다크 테마

## 🚀 시작하기

### 🌐 바로 사용하기
[라이브 데모](https://my-holdem-trainer.vercel.app/)에서 바로 사용할 수 있습니다!

### 💻 로컬 개발
```bash
# 저장소 클론
git clone https://github.com/salmon131/my-holdem-trainer.git
cd my-holdem-trainer

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 🎮 사용법

1. **차트 모드**: 포지션을 선택하여 해당 포지션의 시작 핸드 차트를 확인
   - 셀을 클릭하면 상세한 분석과 이유를 확인할 수 있습니다
2. **커뮤니티 카드 학습 모드**: 5장의 커뮤니티 카드가 주어졌을 때 각 족보별로 만들 수 있는 핸드들을 분석
   - 넛(1등)부터 최하위까지 순서대로 가능한 2장의 홀카드 조합을 확인
   - 스트레이트는 탑카드별로 구분되어 표시

## 🎯 학습 팁

- **초보자**: CO/BTN 차트부터 암기 시작
- **중급자**: UTG/MP 차트로 확장, 커뮤니티 카드 학습으로 족보 이해도 향상
- **고급자**: SB/BB 수비 범위까지 완전 숙지, 다양한 보드 상황에서의 핸드 분석

## 🛠️ 기술 스택

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Deployment**: Vercel

## 📝 차트 데이터

현재 차트는 교육용으로 제작되었으며, 실제 GTO 솔버 결과와는 차이가 있을 수 있습니다. 고급 사용자는 `CHART_DATA`를 실제 GTO 결과로 교체하여 사용할 수 있습니다.

## 🔧 커스터마이징

- `src/entities/chart/data.ts`의 `CHART_DATA` 객체를 수정하여 차트 데이터 변경
- 포지션별 액션 로직을 수정하여 다양한 상황별 차트 추가 가능
- 커뮤니티 카드 학습의 족보 분석 로직은 `src/features/community/CommunityTrainer.tsx`에서 수정 가능

## 📄 라이선스

MIT License

## 🤝 기여하기

버그 리포트나 기능 제안은 이슈로 등록해 주세요.

---

**즐거운 포커 학습 되세요! 🎉**