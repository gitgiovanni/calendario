// Espera o DOM carregar para garantir que todos os elementos existam
document.addEventListener('DOMContentLoaded', function() {

  let nav = 0;
  let clicked = null;
  let events = localStorage.getItem('events') ? JSON.parse(localStorage.getItem('events')) : [];
  let editor = null; // O editor será inicializado apenas uma vez

  // Variaveis do modal
  const newEventModal = document.getElementById('newEventModal');
  const deleteEventModal = document.getElementById('deleteEventModal');
  const backDrop = document.getElementById('modalBackDrop');
  const calendar = document.getElementById('calendar'); // div calendar
  const weekdays = ['domingo','segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  // Inicializa o editor Quill uma única vez
  function initializeEditor() {
    if (!editor) {
      editor = new Quill('#editor', {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            ['link', 'clean']
          ]
        },
        placeholder: 'Escreva suas anotações aqui...'
      });
    }
  }

  function openModal(date) {
    clicked = date;
    const eventDay = events.find((event) => event.date === clicked);

    if (eventDay) {
      document.getElementById('eventText').innerHTML = eventDay.title; // Usa innerHTML para renderizar o formato
      deleteEventModal.style.display = 'flex';
    } else {
      initializeEditor(); // Garante que o editor está pronto
      editor.setContents([]); // Limpa o editor para uma nova anotação
      newEventModal.style.display = 'flex';
    }
    backDrop.style.display = 'block';
  }

  function load() {
    const dt = new Date();

    if (nav !== 0) {
      dt.setMonth(new Date().getMonth() + nav);
    }

    const day = dt.getDate();
    const month = dt.getMonth();
    const year = dt.getFullYear();

    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dateString = firstDayOfMonth.toLocaleDateString('pt-br', {
      weekday: 'long',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });

    const paddingDays = weekdays.indexOf(dateString.split(', ')[0]);

    document.getElementById('monthDisplay').innerText =
      `${dt.toLocaleDateString('pt-br', { month: 'long' }).charAt(0).toUpperCase() + dt.toLocaleDateString('pt-br', { month: 'long' }).slice(1)}, ${year}`;

    calendar.innerHTML = '';

    for (let i = 1; i <= paddingDays + daysInMonth; i++) {
      const daySquare = document.createElement('div');
      daySquare.classList.add('day');
      const dayString = `${month + 1}/${i - paddingDays}/${year}`;

      if (i > paddingDays) {
        daySquare.innerText = i - paddingDays;
        const eventForDay = events.find(e => e.date === dayString);

        // CORREÇÃO: Adicionando a classe 'currentDay' ao invés de ID
        if (i - paddingDays === day && nav === 0) {
          daySquare.classList.add('currentDay');
        }

        if (eventForDay) {
          const eventDiv = document.createElement('div');
          eventDiv.classList.add('event');
          eventDiv.innerHTML = eventForDay.title; // Usa innerHTML para renderizar o formato
          daySquare.appendChild(eventDiv);
        }

        daySquare.addEventListener('click', () => openModal(dayString));
      } else {
        daySquare.classList.add('padding');
      }
      calendar.appendChild(daySquare);
    }
  }

  function closeModal() {
    newEventModal.style.display = 'none';
    deleteEventModal.style.display = 'none';
    backDrop.style.display = 'none';
    clicked = null;
    load();
  }

  function saveEvent() {
    // Pega o conteúdo HTML do editor
    const eventContent = editor.root.innerHTML;
    // Verifica se o conteúdo não está vazio ou é apenas um parágrafo em branco
    if (editor.getText().trim().length > 0) {
      events.push({
        date: clicked,
        title: eventContent,
      });

      localStorage.setItem('events', JSON.stringify(events));
      closeModal();
    } else {
      alert('O campo de anotações não pode estar vazio.');
    }
  }

  function deleteEvent() {
    events = events.filter(e => e.date !== clicked);
    localStorage.setItem('events', JSON.stringify(events));
    closeModal();
  }

  // MELHORIA: Função de PDF aprimorada
  function exportToPdf() {
    // 1. Cria um elemento temporário para impressão
    const printElement = document.createElement('div');
    printElement.style.padding = '20px';
    printElement.style.fontFamily = 'Arial, sans-serif';

    // 2. Clona os elementos desejados (título, dias da semana e calendário)
    const headerClone = document.getElementById('monthDisplay').cloneNode(true);
    const weekdaysClone = document.getElementById('weekdays').cloneNode(true);
    const calendarClone = document.getElementById('calendar').cloneNode(true);

    // Adiciona estilos para o PDF
    headerClone.style.textAlign = 'center';
    headerClone.style.fontSize = '24px';
    headerClone.style.marginBottom = '20px';
    
    // 3. Adiciona os clones ao elemento de impressão
    printElement.appendChild(headerClone);
    printElement.appendChild(weekdaysClone);
    printElement.appendChild(calendarClone);
    
    // 4. Configurações do html2pdf
    const opt = {
      margin: 0.5,
      filename: `calendario_${document.getElementById('monthDisplay').innerText.replace(', ', '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // 5. Gera o PDF a partir do elemento temporário
    html2pdf().set(opt).from(printElement).save();
  }


  function initButtons() {
    document.getElementById('nextButton').addEventListener('click', () => {
      nav++;
      load();
    });

    document.getElementById('backButton').addEventListener('click', () => {
      nav--;
      load();
    });
    
    document.getElementById('pdfButton').addEventListener('click', exportToPdf);
    document.getElementById('saveButton').addEventListener('click', saveEvent);
    document.getElementById('cancelButton').addEventListener('click', closeModal);
    document.getElementById('deleteButton').addEventListener('click', deleteEvent);
    document.getElementById('closeButton').addEventListener('click', closeModal);
  }

  initButtons();
  load();
});
