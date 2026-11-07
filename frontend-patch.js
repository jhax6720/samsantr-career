/*
  삼산여객 채용 홈페이지 index.html 패치
  붙여넣을 위치: const supabaseClient = window.supabase.createClient(...); 바로 아래.
  기존 로그인은 users 테이블 + localStorage(samsan_user)이므로, 이 함수 호출에만
  현재 계정 정보를 붙여 Edge Function이 자체 검증하도록 합니다.
*/
const _originalFunctionsInvoke = supabaseClient.functions.invoke.bind(supabaseClient.functions);
supabaseClient.functions.invoke = async function (functionName, options = {}) {
    if (functionName !== 'confirm-application-result') {
        return _originalFunctionsInvoke(functionName, options);
    }

    let storedUser = null;
    try {
        storedUser = JSON.parse(localStorage.getItem('samsan_user') || 'null');
    } catch (_) {
        storedUser = null;
    }

    const requestBody = options.body && typeof options.body === 'object' && !Array.isArray(options.body)
        ? { ...options.body }
        : {};

    if (!requestBody.username && storedUser && storedUser.username) {
        requestBody.username = storedUser.username;
    }
    if (!requestBody.session_password && storedUser && storedUser.password) {
        requestBody.session_password = storedUser.password;
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/confirm-application-result`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json().catch(() => ({}));
        if (!response.ok || responseData.success === false) {
            return {
                data: null,
                error: new Error(responseData.error || responseData.message || `요청 실패 (HTTP ${response.status})`)
            };
        }
        return { data: responseData, error: null };
    } catch (error) {
        return {
            data: null,
            error: new Error(`결과 서버 연결 실패: ${error instanceof Error ? error.message : String(error)}`)
        };
    }
};
