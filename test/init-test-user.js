#!/usr/bin/env node

/**
 * 通过API初始化测试用户
 * 如果数据库中没有测试用户，可以通过这个脚本创建
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function initTestUser() {
  console.log('🚀 开始初始化测试用户...\n');

  try {
    // 检查后端服务是否可用
    const healthCheck = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    if (!healthCheck.ok) {
      console.error('❌ 后端服务不可用，请先启动后端服务');
      process.exit(1);
    }

    // 创建测试员工
    const employeeData = {
      name: '系统管理员',
      phone: '13800138000',
      role: 'role-boss',
      password: '123456',
      status: 'active'
    };

    console.log('正在检查现有用户...');
    
    // 先检查是否已存在
    const checkResponse = await fetch(`${API_BASE_URL}/settings/employees`);
    if (!checkResponse.ok) {
      throw new Error('无法获取员工列表');
    }
    
    const existingEmployees = await checkResponse.json();
    const existingUser = existingEmployees.find(emp => emp.phone === '13800138000');
    
    if (existingUser) {
      console.log('ℹ️  测试用户已存在，更新密码...');
      const updateResponse = await fetch(`${API_BASE_URL}/settings/employees/${existingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...existingUser,
          password: '123456',
          status: 'active'
        })
      });
      
      if (updateResponse.ok) {
        const result = await updateResponse.json();
        console.log('✅ 测试用户密码已更新！');
        console.log(`   用户ID: ${result.id}`);
        console.log(`   用户名: ${result.name}`);
        console.log(`   手机号: ${result.phone}`);
        console.log(`   密码: 123456`);
        console.log('\n现在可以运行测试：');
        console.log('  npm run test:auth');
        process.exit(0);
      } else {
        const errorText = await updateResponse.text();
        console.error('❌ 更新密码失败');
        console.error('响应:', errorText);
        console.error('\n请手动执行SQL脚本初始化测试用户：');
        console.error('  mysql -u root -p shaxian_erp < database/init_test_user_simple.sql');
        process.exit(1);
      }
    } else {
      console.log('正在创建测试用户...');
      const response = await fetch(`${API_BASE_URL}/settings/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 测试用户创建成功！');
        console.log(`   用户ID: ${result.id}`);
        console.log(`   用户名: ${result.name}`);
        console.log(`   手机号: ${result.phone}`);
        console.log(`   密码: 123456`);
        console.log('\n现在可以运行测试：');
        console.log('  npm run test:auth');
        process.exit(0);
      } else {
        const errorText = await response.text();
        console.error('❌ 创建测试用户失败');
        console.error('响应:', errorText);
        console.error('\n请手动执行SQL脚本初始化测试用户：');
        console.error('  mysql -u root -p shaxian_erp < database/init_test_user_simple.sql');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    console.error('\n请手动执行SQL脚本初始化测试用户：');
    console.error('  mysql -u root -p shaxian_erp < database/init_test_user_simple.sql');
    process.exit(1);
  }
}

initTestUser();
