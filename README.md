# 🃏 Holdem Chart Trainer

포커 차트 암기와 기본기 연습을 위한 웹 애플리케이션입니다.

🌐 **라이브 데모**: [https://my-holdem-trainer.vercel.app/](https://my-holdem-trainer.vercel.app/)

## ✨ 주요 기능

- **📊 포지션별 차트**: UTG, MP, CO, BTN, SB, BB 포지션별 시작 핸드 차트
- **🎯 플래시카드**: 랜덤 핸드에 대한 액션 추측 연습
- **⚡ 퀵 퀴즈**: 5문제 제한의 빠른 테스트
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
2. **플래시카드 모드**: 랜덤으로 제시되는 핸드에 대해 Raise/Call/Fold 중 선택
3. **퀵 퀴즈 모드**: 5문제로 구성된 빠른 테스트

## 🎯 학습 팁

- **초보자**: CO/BTN 차트부터 암기 시작
- **중급자**: UTG/MP 차트로 확장
- **고급자**: SB/BB 수비 범위까지 완전 숙지

## 🛠️ 기술 스택

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Deployment**: Vercel

## 📝 차트 데이터

현재 차트는 교육용으로 제작되었으며, 실제 GTO 솔버 결과와는 차이가 있을 수 있습니다. 고급 사용자는 `CHART_DATA`를 실제 GTO 결과로 교체하여 사용할 수 있습니다.

## 🔧 커스터마이징

- `src/components/HoldemTrainer.tsx`의 `CHART_DATA` 객체를 수정하여 차트 데이터 변경
- 포지션별 액션 로직을 수정하여 다양한 상황별 차트 추가 가능

## 📄 라이선스

MIT License

## 🤝 기여하기

버그 리포트나 기능 제안은 이슈로 등록해 주세요.

---

**즐거운 포커 학습 되세요! 🎉**