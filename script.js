document.getElementById('booking-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const destination = document.getElementById('destination').value;
  const date = document.getElementById('date').value;

  const message = `Faleminderit ${name}, rezervimi për ${destination} më ${date} u krye me sukses!`;

  document.getElementById('confirmation-message').textContent = message;

  this.reset();
});
