function validateEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  function validatePassword(pwd) {
    return typeof pwd === 'string' && pwd.length >= 6;
  }
  
  module.exports = { validateEmail, validatePassword };