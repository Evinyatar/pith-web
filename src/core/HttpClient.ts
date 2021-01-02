import {from, Observable} from "rxjs";

export class HttpClient {

    get(url: string, options: { params?: HttpParams }): Observable<any> {
        if(options.params) {
            url += "?" + options.params.toUrl()
        }
        return this.fetch(url);
    }

    put(url: string, body: any): Observable<any> {
        return this.fetch(url, {
            method: 'put',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    }

    private fetch(url: string, opts?: RequestInit) {
        return from(fetch(url, opts).then(response => response.text()).then(json => JSON.parse(json)));
    }
}

export class HttpParams {
    private params: { [key: string]: string } = {};

    append(key: string, value: string): HttpParams {
        this.params[key] = value;
        return this;
    }

    toUrl() : string{
        return Object.entries(this.params).map(parts => parts.map(encodeURIComponent).join("=")).join("&")
    }
}
