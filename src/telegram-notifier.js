/**
 * BLNK Telegram Notifier (Korean)
 * 텔레그램 알림 발송 (한국어)
 */

const https = require('https');

const CONFIG = {
  token: process.env.TELEGRAM_TOKEN || '8663677672:AAH3w7iB6vXkwWVsfyk9mAxh0v7rQpkEYhY',
  chatId: process.env.TELEGRAM_CHAT_ID || '564592509'
};

class TelegramNotifier {
  constructor() {
    this.token = CONFIG.token;
    this.chatId = CONFIG.chatId;
    this.baseUrl = 'https://api.telegram.org/bot' + this.token;
  }

  async sendMessage(text, options) {
    options = options || {};
    const url = this.baseUrl + '/sendMessage';
    
    const jsonText = text.replace(/\n/g, '\\n');
    
    const data = JSON.stringify({
      chat_id: this.chatId,
      text: jsonText,
      parse_mode: options.parseMode || 'HTML',
      disable_notification: options.silent || false
    });

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Timeout')));
      req.write(data);
      req.end();
    });
  }

  async sendDailyReport(metrics) {
    const lines = [
      '📊 <b>BLNK 일일 리포트</b>',
      '',
      '📈 <b>트래픽</b>',
      '• 총 요청: ' + (metrics.totalRequests || 0) + '회',
      '• 평균 지연: ' + (metrics.avgLatency || 0) + 'ms',
      '• 캐시 히트율: ' + ((metrics.cacheHitRate || 0).toFixed(1)) + '%',
      '',
      '🎯 <b>판정 결과</b>',
      '• ✅ 통과: ' + (metrics.pass || 0) + '회',
      '• ⚠️ 경고: ' + (metrics.warn || 0) + '회',
      '• 🚫 차단: ' + (metrics.block || 0) + '회',
      '',
      '🕐 ' + new Date().toLocaleString('ko-KR')
    ];
    
    return this.sendMessage(lines.join('\n'));
  }

  async sendAlert(level, message) {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨'
    };
    
    const labels = {
      info: '정보',
      warning: '경고',
      critical: '심각'
    };
    
    const icon = icons[level] || '📢';
    const label = labels[level] || '알림';
    
    const lines = [
      icon + ' <b>[' + label + ']</b>',
      '',
      message
    ];
    
    return this.sendMessage(lines.join('\n'));
  }

  async sendImplementationComplete(task) {
    const lines = [
      '✅ <b>자동 구현 완료</b>',
      '',
      '작업: ' + task,
      '완료 시간: ' + new Date().toLocaleString('ko-KR'),
      '',
      '다음 단계: 테스트 및 검증'
    ];
    
    return this.sendMessage(lines.join('\n'));
  }

  async sendResearchSummary(ideas) {
    const lines = [
      '🔬 <b>리서치 결과</b>',
      '',
      ideas.length + '개의 적용 가능한 아이디어를 발견했습니다:'
    ];
    
    for (let i = 0; i < ideas.length; i++) {
      lines.push('• ' + ideas[i]);
    }
    
    lines.push('');
    lines.push('PLAN.md에 추가되었습니다.');
    
    return this.sendMessage(lines.join('\n'));
  }

  async sendTestReport(results) {
    const lines = [
      '🧪 <b>테스트 결과</b>',
      '',
      '✅ 성공: ' + results.passed + '개',
      '❌ 실패: ' + results.failed + '개',
      '',
      '평균 응답 시간: ' + results.avgLatency + 'ms',
      '에러율: ' + (results.errorRate * 100).toFixed(2) + '%'
    ];
    
    if (results.issues && results.issues.length > 0) {
      lines.push('');
      lines.push('⚠️ 발견된 이슈:');
      for (const issue of results.issues.slice(0, 5)) {
        lines.push('• ' + issue);
      }
    }
    
    return this.sendMessage(lines.join('\n'));
  }

  async sendAgentStarted(agentName) {
    const lines = [
      '🤖 <b>' + agentName + '</b>',
      '',
      '에이전트가 시작되었습니다.',
      '시간: ' + new Date().toLocaleString('ko-KR')
    ];
    
    return this.sendMessage(lines.join('\n'));
  }
}

module.exports = { TelegramNotifier };
