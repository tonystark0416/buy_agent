const app = getApp();

Page({
  data: {
    statusBarHeight: 20,
    isLoggedIn: false,
    userId: '',
    nickname: '',
    phoneMasked: '',
    avatarText: '值',
    avatarUrl: '',
  },

  onShow() {
    const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({ statusBarHeight: win.statusBarHeight || 20 });
    this.refreshLoginState();
  },

  /** 读取本地登录态刷新页面 */
  refreshLoginState() {
    const userId = wx.getStorageSync('userId') || '';
    const token = wx.getStorageSync('token') || '';
    const userInfo = wx.getStorageSync('userInfo') || null;
    const phone = (userInfo && userInfo.phone) || '';
    const isLoggedIn = !!(userId && token);

    this.setData({
      isLoggedIn,
      userId: userId || '-',
      nickname: (userInfo && userInfo.nickname) || (phone ? `用户${phone.slice(-4)}` : '值物用户'),
      phoneMasked: this.maskPhone(phone),
      avatarText: phone ? phone.slice(-2) : '值',
      avatarUrl: (userInfo && userInfo.avatar) || '',
    });
  },

  /** 手机号打码：138****0000 */
  maskPhone(phone) {
    if (!/^1\d{10}$/.test(phone || '')) return phone || '-';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  },

  /** 未登录：引导回首页走登录流程 */
  onGoIndex() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  /** 我的订单 */
  onGoOrders() {
    wx.switchTab({ url: '/pages/orders/orders' });
  },

  /** 佣金提现（未开放占位） */
  onWithdraw() {
    wx.showToast({ title: '敬请期待', icon: 'none' });
  },

  /** 退出登录：清本地登录态 + 重置 globalData */
  onLogout() {
    if (!this.data.isLoggedIn) return;
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmColor: '#FF3B30',
      success: ({ confirm }) => {
        if (!confirm) return;
        wx.removeStorageSync('token');
        wx.removeStorageSync('userId');
        wx.removeStorageSync('userInfo');
        app.globalData.token = '';
        app.globalData.userId = '';
        app.globalData.userInfo = null;
        app.globalData.isLogin = false;
        this.refreshLoginState();
        wx.showToast({ title: '已退出登录', icon: 'none' });
      },
    });
  },
});
