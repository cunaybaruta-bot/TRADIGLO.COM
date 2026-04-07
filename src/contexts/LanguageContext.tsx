'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type LangCode = 'en' | 'ar' | 'zh' | 'ms' | 'th' | 'vi';

const translations: Record<LangCode, Record<string, string>> = {
  en: {
    // Hero
    hero_badge: '#1 Crypto Trading Platform',
    hero_heading_1: 'Trade Crypto',
    hero_heading_2: 'like a pro',
    hero_subtitle: 'Advanced trading tools, lightning-fast execution, and unmatched security. Join millions of traders worldwide.',
    hero_bonus_title: '100% Deposit Bonus',
    hero_bonus_desc: 'Deposit $1,000 and trade with $2,000 instantly',
    hero_cta_start: 'Start Trading',
    hero_cta_explore: 'Explore Markets',
    hero_feature_secure: 'Secure Trading',
    hero_feature_realtime: 'Real-time Data',
    hero_feature_support: '24/7 Support',
    hero_feature_deposit: 'Instant Deposit',
    hero_feature_withdraw: 'Instant Withdrawal (Min $10)',
    // Footer
    footer_desc: 'Tradiglo provides a fundamental analysis of the crypto market. In addition to tracking price, volume and market capitalisation, Tradiglo tracks community growth, open-source code development, major events and on-chain metrics.',
    footer_newsletter_title: 'Interested to stay up-to-date with cryptocurrencies?',
    footer_newsletter_desc: 'Get the latest crypto news, updates, and reports by subscribing to our free newsletter.',
    footer_newsletter_placeholder: 'Enter your email address',
    footer_newsletter_btn: 'Subscribe',
    footer_copyright: '© 2026 Tradiglo. All Rights Reserved.',
    footer_disclaimer_label: 'IMPORTANT DISCLAIMER:',
    footer_disclaimer_text: 'All content provided herein our website, hyperlinked sites, associated applications, forums, blogs, social media accounts and other platforms ("Site") is for your general information only, procured from third party sources. We make no warranties of any kind in relation to our content, including but not limited to accuracy and updatedness. No part of the content that we provide constitutes financial advice, legal advice or any other form of advice meant for your specific reliance for any purpose. Any use or reliance on our content is solely at your own risk and discretion. You should conduct your own research, review, analyse and verify our content before relying on them. Trading is a highly risky activity that can lead to major losses, please therefore consult your financial advisor before making any decision. No content on our Site is meant to be a solicitation or offer.',
    // Nav
    nav_markets: 'Markets',
    nav_copy_trading: 'Copy Trading',
    nav_screener: 'Screener',
    nav_news: 'News',
    nav_affiliate: 'Affiliate',
    nav_dashboard: 'Dashboard',
    nav_sign_in: 'Sign In',
    nav_sign_out: 'Sign Out',
    nav_get_started: 'Get Started',
    // Footer categories
    footer_cat_resources: 'Resources',
    footer_cat_support: 'Support',
    footer_cat_about: 'About Tradiglo',
    footer_cat_community: 'Community',
  },
  ar: {
    hero_badge: 'منصة تداول العملات المشفرة #1',
    hero_heading_1: 'تداول العملات المشفرة',
    hero_heading_2: 'كالمحترفين',
    hero_subtitle: 'أدوات تداول متقدمة، تنفيذ فائق السرعة، وأمان لا مثيل له. انضم إلى ملايين المتداولين حول العالم.',
    hero_bonus_title: 'مكافأة إيداع 100%',
    hero_bonus_desc: 'أودع 1,000 دولار وتداول بـ 2,000 دولار فوراً',
    hero_cta_start: 'ابدأ التداول',
    hero_cta_explore: 'استكشف الأسواق',
    hero_feature_secure: 'تداول آمن',
    hero_feature_realtime: 'بيانات فورية',
    hero_feature_support: 'دعم 24/7',
    hero_feature_deposit: 'إيداع فوري',
    hero_feature_withdraw: 'سحب فوري (الحد الأدنى 10$)',
    footer_desc: 'تقدم Tradiglo تحليلاً أساسياً لسوق العملات المشفرة. بالإضافة إلى تتبع السعر والحجم والقيمة السوقية، تتتبع Tradiglo نمو المجتمع وتطوير الكود مفتوح المصدر والأحداث الرئيسية والمقاييس على السلسلة.',
    footer_newsletter_title: 'هل تريد البقاء على اطلاع بآخر أخبار العملات المشفرة؟',
    footer_newsletter_desc: 'احصل على أحدث أخبار العملات المشفرة والتحديثات والتقارير بالاشتراك في نشرتنا الإخبارية المجانية.',
    footer_newsletter_placeholder: 'أدخل عنوان بريدك الإلكتروني',
    footer_newsletter_btn: 'اشترك',
    footer_copyright: '© 2026 Tradiglo. جميع الحقوق محفوظة.',
    footer_disclaimer_label: 'إخلاء مسؤولية مهم:',
    footer_disclaimer_text: 'جميع المحتويات المقدمة في موقعنا الإلكتروني والمواقع المرتبطة والتطبيقات المرتبطة والمنتديات والمدونات وحسابات وسائل التواصل الاجتماعي والمنصات الأخرى ("الموقع") هي لأغراض معلوماتية عامة فقط، مستمدة من مصادر طرف ثالث. لا نقدم أي ضمانات من أي نوع فيما يتعلق بمحتوانا. لا يُعدّ أي جزء من المحتوى الذي نقدمه نصيحة مالية أو قانونية. التداول نشاط عالي المخاطر قد يؤدي إلى خسائر كبيرة، لذا يُرجى استشارة مستشارك المالي قبل اتخاذ أي قرار.',
    nav_markets: 'الأسواق',
    nav_copy_trading: 'نسخ التداول',
    nav_screener: 'الفلتر',
    nav_news: 'الأخبار',
    nav_affiliate: 'الإحالة',
    nav_dashboard: 'لوحة التحكم',
    nav_sign_in: 'تسجيل الدخول',
    nav_sign_out: 'تسجيل الخروج',
    nav_get_started: 'ابدأ الآن',
    footer_cat_resources: 'الموارد',
    footer_cat_support: 'الدعم',
    footer_cat_about: 'عن Tradiglo',
    footer_cat_community: 'المجتمع',
  },
  zh: {
    hero_badge: '#1 加密货币交易平台',
    hero_heading_1: '交易加密货币',
    hero_heading_2: '像专业人士一样',
    hero_subtitle: '先进的交易工具、闪电般的执行速度和无与伦比的安全性。加入全球数百万交易者的行列。',
    hero_bonus_title: '100% 存款奖金',
    hero_bonus_desc: '存入 $1,000，立即以 $2,000 进行交易',
    hero_cta_start: '开始交易',
    hero_cta_explore: '探索市场',
    hero_feature_secure: '安全交易',
    hero_feature_realtime: '实时数据',
    hero_feature_support: '24/7 支持',
    hero_feature_deposit: '即时存款',
    hero_feature_withdraw: '即时提款（最低 $10）',
    footer_desc: 'Tradiglo 提供加密货币市场的基本面分析。除了追踪价格、交易量和市值外，Tradiglo 还追踪社区增长、开源代码开发、重大事件和链上指标。',
    footer_newsletter_title: '想要了解最新的加密货币动态吗？',
    footer_newsletter_desc: '订阅我们的免费新闻通讯，获取最新的加密货币新闻、更新和报告。',
    footer_newsletter_placeholder: '输入您的电子邮件地址',
    footer_newsletter_btn: '订阅',
    footer_copyright: '© 2026 Tradiglo. 版权所有。',
    footer_disclaimer_label: '重要免责声明：',
    footer_disclaimer_text: '本网站及相关平台提供的所有内容仅供一般信息参考，来源于第三方。我们对内容不作任何形式的保证。我们提供的任何内容均不构成财务建议或法律建议。交易是高风险活动，可能导致重大损失，请在做出任何决定前咨询您的财务顾问。',
    nav_markets: '市场',
    nav_copy_trading: '跟单交易',
    nav_screener: '筛选器',
    nav_news: '新闻',
    nav_affiliate: '推荐',
    nav_dashboard: '仪表板',
    nav_sign_in: '登录',
    nav_sign_out: '退出',
    nav_get_started: '立即开始',
    footer_cat_resources: '资源',
    footer_cat_support: '支持',
    footer_cat_about: '关于 Tradiglo',
    footer_cat_community: '社区',
  },
  ms: {
    hero_badge: 'Platform Dagangan Kripto #1',
    hero_heading_1: 'Dagangan Kripto',
    hero_heading_2: 'seperti profesional',
    hero_subtitle: 'Alat dagangan canggih, pelaksanaan pantas, dan keselamatan tiada tandingan. Sertai jutaan pedagang di seluruh dunia.',
    hero_bonus_title: 'Bonus Deposit 100%',
    hero_bonus_desc: 'Deposit $1,000 dan berdagang dengan $2,000 serta-merta',
    hero_cta_start: 'Mula Berdagang',
    hero_cta_explore: 'Terokai Pasaran',
    hero_feature_secure: 'Dagangan Selamat',
    hero_feature_realtime: 'Data Masa Nyata',
    hero_feature_support: 'Sokongan 24/7',
    hero_feature_deposit: 'Deposit Segera',
    hero_feature_withdraw: 'Pengeluaran Segera (Min $10)',
    footer_desc: 'Tradiglo menyediakan analisis asas pasaran kripto. Selain menjejaki harga, volum dan permodalan pasaran, Tradiglo menjejaki pertumbuhan komuniti, pembangunan kod sumber terbuka, peristiwa utama dan metrik on-chain.',
    footer_newsletter_title: 'Berminat untuk sentiasa dikemas kini dengan mata wang kripto?',
    footer_newsletter_desc: 'Dapatkan berita kripto terkini, kemas kini, dan laporan dengan melanggan surat berita percuma kami.',
    footer_newsletter_placeholder: 'Masukkan alamat e-mel anda',
    footer_newsletter_btn: 'Langgan',
    footer_copyright: '© 2026 Tradiglo. Hak Cipta Terpelihara.',
    footer_disclaimer_label: 'PENAFIAN PENTING:',
    footer_disclaimer_text: 'Semua kandungan yang disediakan di laman web kami dan platform berkaitan adalah untuk maklumat umum sahaja, diperolehi daripada sumber pihak ketiga. Kami tidak membuat sebarang jaminan berkaitan kandungan kami. Tiada bahagian kandungan yang kami sediakan merupakan nasihat kewangan atau undang-undang. Dagangan adalah aktiviti berisiko tinggi yang boleh membawa kepada kerugian besar, sila rujuk penasihat kewangan anda sebelum membuat sebarang keputusan.',
    nav_markets: 'Pasaran',
    nav_copy_trading: 'Salin Dagangan',
    nav_screener: 'Penapis',
    nav_news: 'Berita',
    nav_affiliate: 'Afiliasi',
    nav_dashboard: 'Papan Pemuka',
    nav_sign_in: 'Log Masuk',
    nav_sign_out: 'Log Keluar',
    nav_get_started: 'Mulakan',
    footer_cat_resources: 'Sumber',
    footer_cat_support: 'Sokongan',
    footer_cat_about: 'Tentang Tradiglo',
    footer_cat_community: 'Komuniti',
  },
  th: {
    hero_badge: 'แพลตฟอร์มซื้อขายคริปโต #1',
    hero_heading_1: 'ซื้อขายคริปโต',
    hero_heading_2: 'อย่างมืออาชีพ',
    hero_subtitle: 'เครื่องมือการซื้อขายขั้นสูง การดำเนินการที่รวดเร็ว และความปลอดภัยที่ไม่มีใครเทียบ เข้าร่วมกับนักเทรดนับล้านทั่วโลก',
    hero_bonus_title: 'โบนัสฝากเงิน 100%',
    hero_bonus_desc: 'ฝาก $1,000 และเทรดด้วย $2,000 ทันที',
    hero_cta_start: 'เริ่มซื้อขาย',
    hero_cta_explore: 'สำรวจตลาด',
    hero_feature_secure: 'การซื้อขายที่ปลอดภัย',
    hero_feature_realtime: 'ข้อมูลเรียลไทม์',
    hero_feature_support: 'สนับสนุน 24/7',
    hero_feature_deposit: 'ฝากเงินทันที',
    hero_feature_withdraw: 'ถอนเงินทันที (ขั้นต่ำ $10)',
    footer_desc: 'Tradiglo ให้การวิเคราะห์พื้นฐานของตลาดคริปโต นอกจากการติดตามราคา ปริมาณ และมูลค่าตลาดแล้ว Tradiglo ยังติดตามการเติบโตของชุมชน การพัฒนาโค้ดโอเพนซอร์ส เหตุการณ์สำคัญ และเมตริกบนเชน',
    footer_newsletter_title: 'สนใจติดตามข่าวสารคริปโตล่าสุดหรือไม่?',
    footer_newsletter_desc: 'รับข่าวสารคริปโตล่าสุด อัปเดต และรายงานโดยสมัครรับจดหมายข่าวฟรีของเรา',
    footer_newsletter_placeholder: 'กรอกที่อยู่อีเมลของคุณ',
    footer_newsletter_btn: 'สมัครรับ',
    footer_copyright: '© 2026 Tradiglo. สงวนลิขสิทธิ์ทั้งหมด',
    footer_disclaimer_label: 'ข้อจำกัดความรับผิดชอบที่สำคัญ:',
    footer_disclaimer_text: 'เนื้อหาทั้งหมดที่ให้ไว้ในเว็บไซต์และแพลตฟอร์มที่เกี่ยวข้องมีไว้เพื่อข้อมูลทั่วไปเท่านั้น ได้มาจากแหล่งบุคคลที่สาม เราไม่รับประกันใดๆ เกี่ยวกับเนื้อหาของเรา ไม่มีส่วนใดของเนื้อหาที่เราให้ถือเป็นคำแนะนำทางการเงินหรือกฎหมาย การซื้อขายเป็นกิจกรรมที่มีความเสี่ยงสูงซึ่งอาจนำไปสู่การสูญเสียครั้งใหญ่ โปรดปรึกษาที่ปรึกษาทางการเงินของคุณก่อนตัดสินใจ',
    nav_markets: 'ตลาด',
    nav_copy_trading: 'คัดลอกการซื้อขาย',
    nav_screener: 'ตัวกรอง',
    nav_news: 'ข่าว',
    nav_affiliate: 'พันธมิตร',
    nav_dashboard: 'แดชบอร์ด',
    nav_sign_in: 'เข้าสู่ระบบ',
    nav_sign_out: 'ออกจากระบบ',
    nav_get_started: 'เริ่มต้น',
    footer_cat_resources: 'ทรัพยากร',
    footer_cat_support: 'สนับสนุน',
    footer_cat_about: 'เกี่ยวกับ Tradiglo',
    footer_cat_community: 'ชุมชน',
  },
  vi: {
    hero_badge: 'Nền tảng giao dịch Crypto #1',
    hero_heading_1: 'Giao dịch Crypto',
    hero_heading_2: 'như chuyên gia',
    hero_subtitle: 'Công cụ giao dịch tiên tiến, thực thi nhanh như chớp và bảo mật vô song. Tham gia cùng hàng triệu nhà giao dịch trên toàn thế giới.',
    hero_bonus_title: 'Thưởng nạp tiền 100%',
    hero_bonus_desc: 'Nạp $1,000 và giao dịch với $2,000 ngay lập tức',
    hero_cta_start: 'Bắt đầu giao dịch',
    hero_cta_explore: 'Khám phá thị trường',
    hero_feature_secure: 'Giao dịch an toàn',
    hero_feature_realtime: 'Dữ liệu thời gian thực',
    hero_feature_support: 'Hỗ trợ 24/7',
    hero_feature_deposit: 'Nạp tiền tức thì',
    hero_feature_withdraw: 'Rút tiền tức thì (Tối thiểu $10)',
    footer_desc: 'Tradiglo cung cấp phân tích cơ bản về thị trường tiền điện tử. Ngoài việc theo dõi giá, khối lượng và vốn hóa thị trường, Tradiglo còn theo dõi sự tăng trưởng cộng đồng, phát triển mã nguồn mở, các sự kiện lớn và các chỉ số on-chain.',
    footer_newsletter_title: 'Bạn có muốn cập nhật thông tin về tiền điện tử không?',
    footer_newsletter_desc: 'Nhận tin tức, cập nhật và báo cáo tiền điện tử mới nhất bằng cách đăng ký bản tin miễn phí của chúng tôi.',
    footer_newsletter_placeholder: 'Nhập địa chỉ email của bạn',
    footer_newsletter_btn: 'Đăng ký',
    footer_copyright: '© 2026 Tradiglo. Bảo lưu mọi quyền.',
    footer_disclaimer_label: 'TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM QUAN TRỌNG:',
    footer_disclaimer_text: 'Tất cả nội dung được cung cấp trên trang web và các nền tảng liên quan của chúng tôi chỉ dành cho mục đích thông tin chung, được lấy từ các nguồn bên thứ ba. Chúng tôi không đưa ra bất kỳ bảo đảm nào liên quan đến nội dung của mình. Không có phần nào trong nội dung chúng tôi cung cấp cấu thành lời khuyên tài chính hoặc pháp lý. Giao dịch là hoạt động có rủi ro cao có thể dẫn đến tổn thất lớn, vui lòng tham khảo cố vấn tài chính của bạn trước khi đưa ra bất kỳ quyết định nào.',
    nav_markets: 'Thị trường',
    nav_copy_trading: 'Sao chép giao dịch',
    nav_screener: 'Bộ lọc',
    nav_news: 'Tin tức',
    nav_affiliate: 'Liên kết',
    nav_dashboard: 'Bảng điều khiển',
    nav_sign_in: 'Đăng nhập',
    nav_sign_out: 'Đăng xuất',
    nav_get_started: 'Bắt đầu',
    footer_cat_resources: 'Tài nguyên',
    footer_cat_support: 'Hỗ trợ',
    footer_cat_about: 'Về Tradiglo',
    footer_cat_community: 'Cộng đồng',
  },
};

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tradiglo_lang') as LangCode;
      if (saved && translations[saved]) {
        setLangState(saved);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const setLang = (code: LangCode) => {
    setLangState(code);
    try {
      localStorage.setItem('tradiglo_lang', code);
    } catch {
      // localStorage not available
    }
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] ?? translations['en']?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
