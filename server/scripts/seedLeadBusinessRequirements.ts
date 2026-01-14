import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const html = (title: string, bullets: string[], extra?: string) => {
  const li = bullets.map(b => `<li>${b}</li>`).join('');
  return `
    <h2>${title}</h2>
    <p>目标：提升线索处理效率与转化质量，减少重复线索与人工成本。</p>
    <ul>${li}</ul>
    ${extra ? `<p>${extra}</p>` : ''}
  `.trim();
};

async function resolveModuleKey(): Promise<{ key: string; labelZh: string | null }> {
  const direct = await supabase
    .from('navigation_nodes')
    .select('key,label_zh')
    .eq('key', 'lead')
    .is('deleted_at', null)
    .maybeSingle();

  if (direct.data?.key) return { key: String(direct.data.key), labelZh: direct.data.label_zh || null };

  const fallback = await supabase
    .from('navigation_nodes')
    .select('key,label_zh')
    .ilike('label_zh', '%线索%')
    .is('deleted_at', null)
    .limit(1);

  if (fallback.data && fallback.data[0]?.key) return { key: String(fallback.data[0].key), labelZh: fallback.data[0].label_zh || null };

  throw new Error('Cannot find navigation_nodes key for 线索/lead');
}

async function seedLeadBusinessRequirements() {
  const { key: moduleKey, labelZh } = await resolveModuleKey();
  const now = Date.now();

  const items = [
    {
      title: '线索导入与字段映射（Excel/CSV）',
      content: html('线索导入与字段映射（Excel/CSV）', [
        '支持上传 Excel/CSV，提供字段映射向导（必填校验、格式校验）',
        '支持预览导入结果与错误行导出',
        '支持导入策略：追加/覆盖/跳过重复（按手机号/邮箱/公司+姓名）'
      ], '验收：导入 10k 行数据在 2 分钟内完成，错误行可导出。'),
      tags: ['导入', '字段映射', '校验', '批处理'],
      status: 'open',
      proposer_name: '王芳（业务）'
    },
    {
      title: '线索去重与合并策略（自动+人工）',
      content: html('线索去重与合并策略（自动+人工）', [
        '去重规则可配置：手机号、邮箱、微信、企业名称等',
        '重复线索可合并，保留来源记录与变更审计',
        '提供“疑似重复”列表与一键处理'
      ], '验收：同手机号重复导入不产生新线索，支持合并并保留来源。'),
      tags: ['去重', '合并', '规则引擎', '审计'],
      status: 'in_progress',
      proposer_name: '李强（销售）'
    },
    {
      title: '线索分配与回收（规则分配/手工分配/超时回收）',
      content: html('线索分配与回收（规则分配/手工分配/超时回收）', [
        '支持按区域/行业/门店/销售等级进行规则分配',
        '支持主管手工调整分配，保留分配记录',
        '支持超时未跟进自动回收并重新进入待分配池'
      ], '验收：超时阈值可配置；回收后会产生通知并记录审计。'),
      tags: ['分配', '回收', '规则', 'SLA'],
      status: 'open',
      proposer_name: '赵敏（运营）'
    },
    {
      title: '线索状态流转与跟进记录（含提醒）',
      content: html('线索状态流转与跟进记录（含提醒）', [
        '线索状态：新建/跟进中/已联系/无效/已转商机（可配置）',
        '跟进记录支持：文本、下一次跟进时间、附件（图片/文件）',
        '到期未跟进提醒：站内通知/邮件（可配置）'
      ], '验收：列表可按“下一次跟进时间”排序，逾期高亮提示。'),
      tags: ['状态机', '跟进', '提醒', '附件'],
      status: 'open',
      proposer_name: '陈杰（销售）'
    },
    {
      title: '线索转商机与转化漏斗报表（来源/渠道/转化率）',
      content: html('线索转商机与转化漏斗报表（来源/渠道/转化率）', [
        '支持一键转商机，自动带入客户/联系人/来源信息',
        '漏斗按来源/渠道/区域/销售维度统计',
        '支持导出报表与按时间范围对比'
      ], '验收：提供“本周/本月/自定义”维度的转化率与趋势图。'),
      tags: ['转商机', '漏斗', '报表', '渠道'],
      status: 'open',
      proposer_name: '孙悦（业务）'
    }
  ].map((it, idx) => {
    const createdAt = new Date(now - idx * 60_000).toISOString();
    return {
      module_key: moduleKey,
      title: it.title,
      content: it.content,
      tags: it.tags,
      priority: 'medium',
      status: it.status,
      proposer_name: it.proposer_name,
      created_by_id: 'seed',
      created_by_name: 'Seeder',
      created_by_avatar: '',
      created_at: createdAt,
      updated_at: createdAt
    };
  });

  const { data, error } = await supabase.from('business_requirements').insert(items).select('id,title');
  if (error) {
    console.error('Insert failed:', error);
    process.exit(1);
  }

  const countRes = await supabase
    .from('business_requirements')
    .select('*', { count: 'exact', head: true })
    .eq('module_key', moduleKey)
    .is('deleted_at', null);

  console.log(`Seeded 5 business requirements into module_key=${moduleKey} (${labelZh || ''}). Inserted IDs:`);
  for (const row of data || []) {
    console.log(`- ${row.id}: ${row.title}`);
  }
  console.log(`Total requirements for this module in DB: ${countRes.count ?? 'unknown'}`);
}

seedLeadBusinessRequirements().catch((e) => {
  console.error(e);
  process.exit(1);
});
