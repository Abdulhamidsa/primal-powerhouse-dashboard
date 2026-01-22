const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAndCreateAdmin() {
  try {
    console.log('🔍 Checking for admin/coach users in production...\n');

    // Check existing admins
    const admins = await prisma.user.findMany({
      where: { role: 'COACH' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log('📋 Current admin/coach users:');
    if (admins.length === 0) {
      console.log('   None found\n');
    } else {
      admins.forEach((admin, idx) => {
        console.log(`   ${idx + 1}. ${admin.name} (${admin.email})`);
      });
      console.log('');
    }

    // Create your admin account
    const adminEmail = 'coach@primalpowerhouse.com';
    const adminPassword = 'Coach2025!Primal';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        name: 'Abdulhamid Alsaadi',
        role: 'COACH',
      },
      create: {
        email: adminEmail,
        name: 'Abdulhamid Alsaadi',
        password: hashedPassword,
        role: 'COACH',
      },
    });

    console.log('✅ Coach/Admin account ready!\n');
    console.log('📋 COACH LOGIN CREDENTIALS:');
    console.log('============================');
    console.log('Name:', admin.name);
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('\n🌐 LOGIN URL:');
    console.log('https://app.primalpowerhouse.com/admin/login');
    console.log('\n💡 TIP: Use this account to assign workouts and meals to Josefine');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateAdmin();
