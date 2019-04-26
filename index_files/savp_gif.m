
h = figure;
axis tight manual
for n = 1:10
    imshow(tmp2(:,:,:,n),clrmap)
    frame = getframe(h);
    im = frame2im(frame);
    im = im(37:100,109:364,:);
    [imind,cm] = rgb2ind(im,256);
      if n == 1 
          imwrite(imind,cm,'savp3.gif','gif', 'DelayTime', .2, 'Loopcount',inf); 
      else 
          imwrite(imind,cm,'savp3.gif','gif','DelayTime',.2, 'WriteMode','append'); 
      end 
end


% 109:364