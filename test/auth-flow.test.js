#!/usr/bin/env node

/**
 * 租户登录流程自动化测试
 * 
 * 测试内容：
 * 1. 使用默认密码123456登录
 * 2. 测试错误密码登录
 * 3. 测试不存在的用户登录
 * 4. 测试登录成功后的用户信息返回
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// 测试结果统计
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n🧪 测试: ${name}`, colors.cyan);
}

function logPass(message) {
  log(`  ✅ ${message}`, colors.green);
  testResults.passed++;
  testResults.total++;
}

function logFail(message, error = null) {
  log(`  ❌ ${message}`, colors.red);
  testResults.failed++;
  testResults.total++;
  if (error) {
    testResults.errors.push({ test: message, error: error.message || error });
    log(`     错误: ${error.message || error}`, colors.red);
  }
}

// API请求封装
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    throw new Error(`请求失败: ${error.message}`);
  }
}

// 测试1: 使用默认密码123456登录
async function testLoginWithDefaultPassword() {
  logTest('测试1: 使用默认密码123456登录');
  
  try {
    const { status, data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        phone: '13800138000',
        password: '123456'
      })
    });

    if (status === 200 && data.success === true) {
      logPass('登录成功');
      
      // 验证返回的用户信息
      if (data.user && data.user.id && data.user.name) {
        logPass('用户信息返回正确');
        log(`     用户ID: ${data.user.id}`, colors.yellow);
        log(`     用户名: ${data.user.name}`, colors.yellow);
        log(`     手机号: ${data.user.phone}`, colors.yellow);
      } else {
        logFail('用户信息格式不正确', { message: '缺少必要字段' });
      }
    } else {
      logFail('登录失败', { message: data.message || '未知错误' });
    }
  } catch (error) {
    logFail('登录请求失败', error);
  }
}

// 测试2: 测试错误密码登录
async function testLoginWithWrongPassword() {
  logTest('测试2: 使用错误密码登录');
  
  try {
    const { status, data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        phone: '13800138000',
        password: 'wrongpassword'
      })
    });

    // 如果用户不存在，先提示需要初始化测试用户
    if (status === 401 && data.success === false && data.message.includes('用户不存在')) {
      logFail('测试账号不存在，请先执行 database/init_test_user_simple.sql 初始化测试用户', { 
        message: '需要先初始化测试用户才能测试错误密码场景' 
      });
      return;
    }

    if (status === 401 && data.success === false && (data.message.includes('密码') || data.message.includes('错误'))) {
      logPass('错误密码被正确拒绝');
    } else {
      logFail('错误密码验证失败', { 
        message: `期望401状态码和密码错误消息，实际: ${status}, ${JSON.stringify(data)}` 
      });
    }
  } catch (error) {
    logFail('测试请求失败', error);
  }
}

// 测试3: 测试不存在的用户登录
async function testLoginWithNonExistentUser() {
  logTest('测试3: 使用不存在的手机号登录');
  
  try {
    const { status, data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        phone: '99999999999',
        password: '123456'
      })
    });

    if (status === 401 && data.success === false && data.message.includes('用户不存在')) {
      logPass('不存在的用户被正确拒绝');
    } else {
      logFail('不存在用户验证失败', { 
        message: `期望401状态码和"用户不存在"消息，实际: ${status}, ${JSON.stringify(data)}` 
      });
    }
  } catch (error) {
    logFail('测试请求失败', error);
  }
}

// 测试4: 测试空参数登录
async function testLoginWithEmptyParams() {
  logTest('测试4: 使用空参数登录');
  
  try {
    const { status, data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        phone: '',
        password: ''
      })
    });

    if (status === 400 && data.success === false && data.message.includes('不能为空')) {
      logPass('空参数被正确拒绝');
    } else {
      logFail('空参数验证失败', { 
        message: `期望400状态码和"不能为空"消息，实际: ${status}, ${JSON.stringify(data)}` 
      });
    }
  } catch (error) {
    logFail('测试请求失败', error);
  }
}

// 测试5: 测试健康检查
async function testHealthCheck() {
  logTest('测试5: 后端服务健康检查');
  
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const data = await response.json();
    
    if (response.status === 200 && data.status === 'ok') {
      logPass('后端服务正常运行');
      log(`     时间戳: ${data.timestamp}`, colors.yellow);
    } else {
      logFail('健康检查失败', { message: '服务状态异常' });
    }
  } catch (error) {
    logFail('无法连接到后端服务', error);
    log(`     请确保后端服务已启动: mvn spring-boot:run (在 server-springboot 目录下)`, colors.yellow);
  }
}

// 主测试函数
async function runTests() {
  log('\n' + '='.repeat(60), colors.blue);
  log('🚀 开始运行租户登录流程自动化测试', colors.blue);
  log('='.repeat(60), colors.blue);
  log(`API地址: ${API_BASE_URL}`, colors.yellow);
  log(`测试时间: ${new Date().toLocaleString('zh-CN')}`, colors.yellow);

  // 先检查服务是否可用
  await testHealthCheck();
  
  // 如果健康检查失败，停止测试
  if (testResults.failed > 0 && testResults.errors.some(e => e.error.includes('无法连接'))) {
    log('\n⚠️  后端服务不可用，停止测试', colors.yellow);
    printSummary();
    process.exit(1);
  }

  // 运行登录相关测试
  await testLoginWithDefaultPassword();
  await testLoginWithWrongPassword();
  await testLoginWithNonExistentUser();
  await testLoginWithEmptyParams();

  // 打印测试总结
  printSummary();
}

// 打印测试总结
function printSummary() {
  log('\n' + '='.repeat(60), colors.blue);
  log('📊 测试结果总结', colors.blue);
  log('='.repeat(60), colors.blue);
  log(`总测试数: ${testResults.total}`, colors.cyan);
  log(`通过: ${testResults.passed}`, colors.green);
  log(`失败: ${testResults.failed}`, colors.red);
  
  if (testResults.errors.length > 0) {
    log('\n❌ 错误详情:', colors.red);
    testResults.errors.forEach((err, index) => {
      log(`  ${index + 1}. ${err.test}`, colors.red);
      log(`     错误: ${err.error}`, colors.yellow);
    });
  }

  log('\n' + '='.repeat(60), colors.blue);
  
  if (testResults.failed === 0) {
    log('✅ 所有测试通过！', colors.green);
    process.exit(0);
  } else {
    log('❌ 部分测试失败，请检查错误信息', colors.red);
    process.exit(1);
  }
}

// 运行测试
runTests().catch(error => {
  log(`\n💥 测试执行出错: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

