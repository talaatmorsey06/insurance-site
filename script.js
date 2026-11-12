// Main Application Script
document.addEventListener('DOMContentLoaded', () => {
  console.log('تم تحميل الصفحة بنجاح');

  // Example event listener
  const actionButtons = document.querySelectorAll('.btn');
  actionButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      console.log('تم النقر على الزر:', event.target.textContent);
    });
  });
});
