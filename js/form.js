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

            // mapeamento dos links de pagamento
            const links = {
                'pista-individual': 'https://mpago.la/26utHM6',
                'pista-casadinha': 'https://mpago.la/1dy8ou3',
                'backstage-individual': 'https://mpago.la/2TThspw',
                'backstage-casadinha': 'https://mpago.la/2N1y5Ds'
            };

            const targetUrl = links[tipoVal] || 'obrigado.html';

            // monta payload com os dados do formulário
            const payload = {
                nome: document.getElementById('nome') ? document.getElementById('nome').value : '',
                cpf: cpfVal,
                ddd: dddVal,
                telefone: telVal,
                email: document.getElementById('email') ? document.getElementById('email').value : '',
                tipo: tipoVal,
                timestamp: new Date().toISOString()
            };

            const webhookUrl = 'https://hook.us2.make.com/xhydjtkf74bqsj6n1m7k45ugreyyehje';

            // Abrir link de pagamento em nova aba de forma síncrona para evitar bloqueio de popup
            try {
                window.open(targetUrl, '_blank');
            } catch (err) {
                // se falhar ao abrir, tentamos navegar na mesma aba como fallback
                window.location.href = targetUrl;
            }
            // Enviar como JSON (campos separados) via HTTPS para o Make receber variáveis separadas.
            // Fluxo simples e confiável:
            // 1) abrir nova aba para pagamento
            // 2) tentar POST JSON com timeout
            // 3) se falhar, tentar sendBeacon como fallback
            // 4) redirecionar a aba atual para "obrigado.html"

            console.log('[form] Enviando payload JSON ao webhook (HTTPS):', payload);

            async function postJsonOnce(url, data, timeout = 2500) {
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), timeout);
                try {
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(data),
                        mode: 'cors',
                        keepalive: true,
                        signal: controller.signal
                    });
                    clearTimeout(id);
                    return resp;
                } catch (err) {
                    clearTimeout(id);
                    console.warn('[webhook] POST JSON erro:', err);
                    return null;
                }
            }

            const resp = await postJsonOnce(webhookUrl, payload, 2500);
            if (resp && (resp.ok || resp.status === 204)) {
                console.log('[webhook] POST JSON OK:', resp.status);
                window.location.href = 'obrigado.html';
                return;
            }

            // fallback: sendBeacon
            if (navigator && navigator.sendBeacon) {
                try {
                    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                    const ok = navigator.sendBeacon(webhookUrl, blob);
                    console.log('[webhook] sendBeacon resultado:', ok);
                } catch (err) {
                    console.warn('[webhook] sendBeacon falhou:', err);
                }
            }

            // finaliza redirecionando mesmo que o envio tenha falhado
            window.location.href = 'obrigado.html';
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
