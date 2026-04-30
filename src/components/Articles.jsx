import React from 'react';

const Articles = () => {
  return (
    <div className="mt-16 border-t border-leica-gray pt-12 mb-12">
      <h2 className="text-2xl font-bold text-white mb-8 text-center uppercase tracking-widest">Photography Journal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Card 1 */}
        <article className="bg-leica-darkgray border border-leica-gray rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1 duration-300">
          <div className="h-40 bg-black/50 flex items-center justify-center border-b border-leica-gray">
            <span className="text-5xl opacity-80">🕵️‍♂️</span>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <h3 className="text-lg font-bold text-white leading-snug">메타데이터(EXIF) 삭제의 중요성</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              스마트폰이나 디지털 카메라로 찍은 사진에는 촬영 시간, 카메라 기종뿐만 아니라 <strong>정확한 GPS 위치 정보</strong>가 숨겨져 있습니다. SNS에 원본을 그대로 올릴 경우 동선이 노출될 수 있으므로 배포 전 EXIF 제거는 필수입니다.
            </p>
          </div>
        </article>
        
        {/* Card 2 */}
        <article className="bg-leica-darkgray border border-leica-gray rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1 duration-300">
          <div className="h-40 bg-black/50 flex items-center justify-center border-b border-leica-gray">
            <span className="text-5xl opacity-80">📷</span>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <h3 className="text-lg font-bold text-white leading-snug">빈티지 렌즈의 글로우(Glow) 살리기</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              올드 렌즈 특유의 부드러운 감성을 디지털로 재현하려면 <strong>하이라이트 억제와 DR(Dynamic Range) 클리핑</strong>이 중요합니다. 에디터에서 'DR Clip White' 값을 낮춰 명부를 날려버리고, 라이카 특유의 묵직한 톤을 만들어 보세요.
            </p>
          </div>
        </article>
        
        {/* Card 3 */}
        <article className="bg-leica-darkgray border border-leica-gray rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1 duration-300">
          <div className="h-40 bg-black/50 flex items-center justify-center border-b border-leica-gray">
            <span className="text-5xl opacity-80">🛡️</span>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <h3 className="text-lg font-bold text-white leading-snug">서버리스 웹 툴의 완벽한 보안</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              기존 사진 편집기들은 사용자의 사진을 외부 서버로 전송합니다. CleanExif는 <strong>HTML5 Canvas API</strong>를 활용해 귀하의 기기 메모리에서만 연산을 수행하므로 해킹이나 데이터 유출로부터 100% 안전합니다.
            </p>
          </div>
        </article>

      </div>
    </div>
  );
};

export default Articles;
