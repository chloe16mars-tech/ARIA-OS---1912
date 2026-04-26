import { describe, expect, it } from 'vitest';
import { isSafePublicUrl } from './ssrf-guard';

describe('isSafePublicUrl', () => {
  it('accepts plain https URLs', () => {
    expect(isSafePublicUrl('https://example.com')).toBe(true);
    expect(isSafePublicUrl('https://www.youtube.com/watch?v=abc')).toBe(true);
  });

  it('rejects non-http(s) protocols', () => {
    expect(isSafePublicUrl('file:///etc/passwd')).toBe(false);
    expect(isSafePublicUrl('ftp://example.com')).toBe(false);
    expect(isSafePublicUrl('gopher://example.com')).toBe(false);
    expect(isSafePublicUrl('data:text/html,<script>')).toBe(false);
  });

  it('rejects loopback hostnames', () => {
    expect(isSafePublicUrl('http://localhost')).toBe(false);
    expect(isSafePublicUrl('http://localhost:8080')).toBe(false);
    expect(isSafePublicUrl('http://api.localhost')).toBe(false);
  });

  it('rejects private IPv4 ranges', () => {
    expect(isSafePublicUrl('http://127.0.0.1')).toBe(false);
    expect(isSafePublicUrl('http://10.0.0.5')).toBe(false);
    expect(isSafePublicUrl('http://192.168.1.1')).toBe(false);
    expect(isSafePublicUrl('http://172.16.0.1')).toBe(false);
    expect(isSafePublicUrl('http://172.31.255.255')).toBe(false);
    expect(isSafePublicUrl('http://0.0.0.0')).toBe(false);
  });

  it('rejects cloud metadata link-local range', () => {
    expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
  });

  it('rejects metadata service hostnames', () => {
    expect(isSafePublicUrl('http://metadata.google.internal/')).toBe(false);
    expect(isSafePublicUrl('http://metadata.goog/')).toBe(false);
  });

  it('rejects IPv6 loopback and private prefixes', () => {
    expect(isSafePublicUrl('http://[::1]/')).toBe(false);
    expect(isSafePublicUrl('http://[fe80::1]/')).toBe(false);
    expect(isSafePublicUrl('http://[fc00::1]/')).toBe(false);
    expect(isSafePublicUrl('http://[fd12:3456:789a::1]/')).toBe(false);
  });

  it('keeps 172.32.x.x reachable (not in private range)', () => {
    expect(isSafePublicUrl('http://172.32.0.1')).toBe(true);
  });

  it('rejects garbage input', () => {
    expect(isSafePublicUrl('not-a-url')).toBe(false);
    expect(isSafePublicUrl('')).toBe(false);
  });
});
