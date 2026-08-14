// 拾光集：类型对应的分类选项与配色（每个分类可配置不同颜色）
export const GAME_CATEGORIES = [
  '角色扮演', '动作', '射击', '冒险', '策略', '格斗', '竞速', '运动',
  '益智', '模拟', '音乐', '卡牌', '沙盒', '恐怖', '生存',
];

export const FILM_CATEGORIES = [
  '科幻', '歌舞', '史诗', '爱情', '恐怖', '家庭伦理', '职场', '都市',
  '悬疑犯罪', '谍战', '战争', '历史', '仙侠', '喜剧',
];

export const CATEGORIES_BY_KIND = {
  游戏: GAME_CATEGORIES,
  影视: FILM_CATEGORIES,
};

// 分类 -> 主题色（6 位 hex，便于叠加透明背景）
export const CATEGORY_COLORS = {
  // 游戏
  角色扮演: '#8e44ad', 动作: '#e74c3c', 射击: '#c0392b', 冒险: '#27ae60',
  策略: '#2980b9', 格斗: '#d35400', 竞速: '#e67e22', 运动: '#16a085',
  益智: '#f39c12', 模拟: '#3498db', 音乐: '#9b59b6', 卡牌: '#1abc9c',
  沙盒: '#7f8c8d', 恐怖: '#5f27cd', 生存: '#00b894',
  // 影视
  科幻: '#0984e3', 歌舞: '#fd79a8', 史诗: '#b33939', 爱情: '#e84393',
  家庭伦理: '#e17055', 职场: '#636e72', 都市: '#00b894', 悬疑犯罪: '#8c7ae6',
  谍战: '#3867d6', 战争: '#5f6b7a', 历史: '#b8860b', 仙侠: '#a55eea',
  喜剧: '#f39c12',
};

export function categoryColor(category) {
  return CATEGORY_COLORS[category] || '#888888';
}

// 是否属于需要分类下拉的类型
export function hasCategorySelector(kind) {
  return kind === '游戏' || kind === '影视';
}
