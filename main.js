document.addEventListener('DOMContentLoaded', function() {

  let nav = 0;
  let clicked = null;
  let events = localStorage.getItem('events') ? JSON.parse(localStorage.getItem('events')) : [];
  let editor = null; 

  const newEventModal = document.getElementById('newEventModal');
  const deleteEventModal = document.getElementById('deleteEventModal');
  const backDrop = document.getElementById('modalBackDrop');
  const calendar = document.getElementById('calendar'); 
  const weekdays = ['domingo','segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  
  // NOVO: Referência para o input de cor
  const eventColorInput = document.getElementById('eventColorInput');

  // ... (função initializeEditor sem alterações) ...
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
    const defaultColor = '#64b6e5'; // Cor padrão

    if (eventDay) {
      document.getElementById('eventText').innerHTML = eventDay.title;
      // NOVO: Mostra a cor do evento na borda
      document.getElementById('eventText').style.borderLeft = `5px solid ${eventDay.color || defaultColor}`;
      deleteEventModal.style.display = 'flex';
    } else {
      initializeEditor(); 
      editor.setContents([]);
      // NOVO: Reseta o seletor para a cor padrão ao abrir
      eventColorInput.value = defaultColor; 
      newEventModal.style.display = 'flex';
    }
    backDrop.style.display = 'block';
  }

  function load() {
    // ... (parte inicial da função `load` sem alterações) ...
    const dt = new Date();
    if (nav !== 0) { dt.setMonth(new Date().getMonth() + nav); }
    const day = dt.getDate();
    const month = dt.getMonth();
    const year = dt.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dateString = firstDayOfMonth.toLocaleDateString('pt-br', {
      weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric',
    });
    const paddingDays = weekdays.indexOf(dateString.split(', ')[0]);
    document.getElementById('monthDisplay').innerText = 
      `${dt.toLocaleDateString('pt-br', { month: 'long' }).charAt(0).toUpperCase() + dt.toLocaleDateString('pt-br', { month: 'long' }).slice(1)}, ${year}`;
    calendar.innerHTML = '';
    
    // Loop de criação dos dias do calendário
    for (let i = 1; i <= paddingDays + daysInMonth; i++) {
      const daySquare = document.createElement('div');
      daySquare.classList.add('day');
      const dayString = `${month + 1}/${i - paddingDays}/${year}`;

      if (i > paddingDays) {
        daySquare.innerText = i - paddingDays;
        const eventForDay = events.find(e => e.date === dayString);

        if (i - paddingDays === day && nav === 0) {
          daySquare.classList.add('currentDay');
        }

        if (eventForDay) {
          const eventDiv = document.createElement('div');
          eventDiv.classList.add('event');
          // NOVO: Define a cor de fundo da anotação com base no que foi salvo
          // Se não houver cor salva (anotações antigas), usa uma cor padrão
          eventDiv.style.backgroundColor = eventForDay.color || '#64b6e5';
          eventDiv.innerHTML = eventForDay.title;
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
    // NOVO: Limpa a borda colorida ao fechar
    document.getElementById('eventText').style.borderLeft = 'none'; 
    clicked = null;
    load();
  }

  function saveEvent() {
    const eventContent = editor.root.innerHTML;
    
    if (editor.getText().trim().length > 0) {
      // NOVO: Adiciona a propriedade 'color' ao objeto do evento
      events.push({
        date: clicked,
        title: eventContent,
        color: eventColorInput.value, // Pega o valor do seletor de cor
      });

      localStorage.setItem('events', JSON.stringify(events));
      closeModal();
    } else {
      alert('O campo de anotações não pode estar vazio.');
    }
  }

  // ... (funções deleteEvent, exportToPdf, initButtons sem alterações) ...
  function deleteEvent() {
    events = events.filter(e => e.date !== clicked);
    localStorage.setItem('events', JSON.stringify(events));
    closeModal();
  }
    function exportToPdf() {
    // 1. Pega o container do calendário e o título
    const monthDisplay = document.getElementById('monthDisplay');
    const weekdays = document.getElementById('weekdays');
    const calendar = document.getElementById('calendar');

    // 2. Cria um elemento temporário para impressão e clona os conteúdos
    const printElement = document.createElement('div');
    printElement.style.padding = '20px';
    printElement.style.fontFamily = 'Arial, sans-serif';
    printElement.style.width = '100%'; // Garante que o conteúdo ocupe a largura

    const headerClone = monthDisplay.cloneNode(true);
    const weekdaysClone = weekdays.cloneNode(true);
    const calendarClone = calendar.cloneNode(true);

    // Adiciona estilos para o cabeçalho no PDF
    headerClone.style.textAlign = 'center';
    headerClone.style.fontSize = '24px';
    headerClone.style.marginBottom = '20px';
    
    // 3. NOVO: Preparar o clone para impressão (aqui está a mágica!)
    
    // Para cada "dia" no calendário clonado...
    const dayElements = calendarClone.querySelectorAll('.day');
    dayElements.forEach(day => {
      // Remove a altura fixa, permitindo que o dia cresça conforme o conteúdo
      day.style.height = 'auto'; 
      day.style.minHeight = '100px'; // Garante uma altura mínima para dias vazios
      day.style.justifyContent = 'flex-start'; // Alinha o número no topo
    });

    // Para cada "anotação" no calendário clonado...
    const eventElements = calendarClone.querySelectorAll('.event');
    eventElements.forEach(event => {
      // Remove as restrições de altura e corte
      event.style.maxHeight = 'none';
      event.style.overflow = 'visible';
      // Garante que o texto quebre a linha corretamente
      event.style.whiteSpace = 'normal';
      event.style.wordBreak = 'break-word';
    });

    // 4. Adiciona os clones preparados ao elemento de impressão
    printElement.appendChild(headerClone);
    printElement.appendChild(weekdaysClone);
    printElement.appendChild(calendarClone);
    
    // 5. Configurações e geração do html2pdf
    const opt = {
      margin:       0.5,
      filename:     `calendario_${monthDisplay.innerText.replace(', ', '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // 6. Gera o PDF a partir do elemento temporário e modificado
    html2pdf().set(opt).from(printElement).save();
  }
  function initButtons() {
    document.getElementById('nextButton').addEventListener('click', () => { nav++; load(); });
    document.getElementById('backButton').addEventListener('click', () => { nav--; load(); });
    document.getElementById('pdfButton').addEventListener('click', exportToPdf);
    document.getElementById('saveButton').addEventListener('click', saveEvent);
    document.getElementById('cancelButton').addEventListener('click', closeModal);
    document.getElementById('deleteButton').addEventListener('click', deleteEvent);
    document.getElementById('closeButton').addEventListener('click', closeModal);
  }

  initButtons();
  load();
});
