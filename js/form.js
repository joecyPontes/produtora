// form.js
// máscaras simples e validação de CPF (algoritmo oficial)

document.addEventListener('DOMContentLoaded', function () {
    const cpfInput = document.getElementById('cpf');
    const dddInput = document.getElementById('ddd');
    const telInput = document.getElementById('telefone');
    const form = document.getElementById('form-ingressos');

    if (cpfInput) {
        cpfInput.addEventListener('input', onCpfInput);
        cpfInput.addEventListener('blur', function () {
            const clean = onlyDigits(cpfInput.value);
            if (clean.length === 11 && !validateCPF(clean)) {
                cpfInput.setCustomValidity('CPF inválido');
            } else {
                cpfInput.setCustomValidity('');
            }
        });
    }

    if (dddInput) {
        dddInput.addEventListener('input', function (e) {
            this.value = onlyDigits(this.value).slice(0, 2);
        });
    }

    if (telInput) {
        telInput.addEventListener('input', function (e) {
            // aceita 8 ou 9 dígitos
            this.value = onlyDigits(this.value).slice(0, 9);
        });
    }

    if (form) {
        form.addEventListener('submit', async function (e) {
            // validações extras antes do envio
            e.preventDefault(); // sempre prevenimos e controlamos o fluxo via JS
            const cpfVal = cpfInput ? onlyDigits(cpfInput.value) : '';
            const dddVal = dddInput ? onlyDigits(dddInput.value) : '';
            const telVal = telInput ? onlyDigits(telInput.value) : '';
            const tipoSel = document.getElementById('tipo');
            const tipoVal = tipoSel ? tipoSel.value : '';

            if (!cpfVal || cpfVal.length !== 11 || !validateCPF(cpfVal)) {
                alert('Por favor informe um CPF válido.');
                cpfInput.focus();
                return;
            }

            if (!dddVal || dddVal.length !== 2) {
                alert('Por favor informe o DDD com 2 dígitos.');
                dddInput.focus();
                return;
            }

            if (!telVal || (telVal.length !== 8 && telVal.length !== 9)) {
                alert('Por favor informe um telefone com 8 ou 9 dígitos (ex: 912345678).');
                telInput.focus();
                return;
            }

            if (!tipoVal) {
                alert('Por favor escolha um tipo de ingresso.');
                tipoSel.focus();
                return;
            }

            // calcula preço baseado no tipo selecionado (mapa cliente)
            const priceMap = {
                'pista-individual': 0.10,
                'pista-casadinha': 0.10,
                'backstage-individual': 0.10,
                'backstage-casadinha': 0.10,
                'early-entry-pista': 0.10,
                'early-entry-backstage': 0.10
            };

            const price = priceMap[tipoVal] || 0;

            // monta payload com os dados do formulário (inclui price)
            const payload = {
                nome: document.getElementById('nome') ? document.getElementById('nome').value : '',
                cpf: cpfVal,
                ddd: dddVal,
                telefone: telVal,
                email: document.getElementById('email') ? document.getElementById('email').value : '',
                tipo: tipoVal,
                price: price,
                timestamp: new Date().toISOString()
            };

            const webhookUrl = 'https://hook.us2.make.com/wx7kbc01chv9p8ej1kzmf2hwau4k0htd';

            // Desabilita botão de submit para evitar envios duplicados
            const submitBtn = document.querySelector('#form-ingressos button[type="submit"]');
            let originalBtnText = '';
            if (submitBtn) {
                originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Aguarde...';
            }

            try {
                console.log('[form] enviando payload ao Make:', payload);
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 7000);

                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    mode: 'cors',
                    signal: controller.signal
                });
                clearTimeout(timeout);

                // ler como texto primeiro (mais seguro) e tentar parsear JSON
                const text = await response.text();
                let data = null;
                try {
                    data = text ? JSON.parse(text) : null;
                } catch (err) {
                    console.warn('[form] resposta do Make não é JSON:', text);
                    data = null;
                }

                // tenta extrair init_point/link de várias formas
                let link = null;
                if (data) {
                    link = data.link || data.init_point || data.sandbox_init_point || data.initPoint || null;
                }

                // fallback: extrair do texto via regex (caso Make retorne o objeto dentro de um campo Data longo)
                if (!link && text) {
                    // procura por "init_point":"..." ou "sandbox_init_point":"..."
                    const m = text.match(/"init_point"\s*:\s*"([^"]+)"/i) || text.match(/"sandbox_init_point"\s*:\s*"([^"]+)"/i);
                    if (m && m[1]) link = m[1];
                }

                if (!response.ok) {
                    console.error('[form] Make retornou status:', response.status, text);
                    if (response.status === 410) {
                        alert('Erro: webhook inválido/expirado (410). Gere um novo webhook no Make e atualize o código.');
                    } else {
                        alert('Erro na criação do pagamento. Tente novamente.');
                    }
                    return;
                }

                if (link) {
                    console.log('[form] link encontrado:', link);
                    window.open(link, '_blank');
                    window.location.href = 'obrigado.html';
                    return;
                } else {
                    console.warn('[form] não foi possível localizar init_point/link na resposta:', text);
                    alert('Erro ao gerar link de pagamento. Entre em contato com o suporte');
                    return;
                }
            } catch (err) {
                console.error('[form] erro ao enviar para o Make:', err);
                if (err.name === 'AbortError') {
                    alert('Tempo esgotado ao conectar com o servidor. Tente novamente.');
                } else {
                    alert('Erro ao conectar com o servidor. Tente novamente.');
                }
                return;
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });
    }

    // helpers
    function onlyDigits(value) {
        return value.replace(/\D+/g, '');
    }

    function onCpfInput(e) {
        const v = onlyDigits(e.target.value).slice(0, 11);
        let out = '';
        if (v.length > 0) out = v.substring(0, 3);
        if (v.length >= 4) out += '.' + v.substring(3, 6);
        if (v.length >= 7) out += '.' + v.substring(6, 9);
        if (v.length >= 10) out += '-' + v.substring(9, 11);
        e.target.value = out;
    }

    // Validação oficial do CPF
    function validateCPF(strCPF) {
        if (!strCPF) return false;
        // remove não-dígitos
        const cpf = strCPF.replace(/\D+/g, '');
        if (cpf.length !== 11) return false;
        // rejeita CPFs com todos dígitos iguais
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        let sum = 0;
        let remainder;

        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10), 10)) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11), 10)) return false;

        return true;
    }
});
