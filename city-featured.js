// The published Cities sheet uses checkbox values; blank and unchecked cities are dots only.
window.EUGACities = {
  isFeatured(value) {
    return value === true || /^(true|yes|1|x)$/i.test(String(value ?? '').trim());
  }
};
